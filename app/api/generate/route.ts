import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const levelInstructions = {
  serious: '誠実で信頼性の高い理由を作成してください。真面目で説得力のある内容にしてください。',
  normal: '自然でバランスの取れた言い訳を作成してください。現実的で納得しやすい内容にしてください。',
  light: '少しユーモアを含む言い訳を作成してください。軽めですが使える内容にしてください。',
  joke: '明らかに冗談だとわかる面白い言い訳を作成してください。クスッと笑える内容にしてください。',
};

// ルーレット用のゾーン別指示
const zoneInstructions: { [key: string]: string } = {
  serious: `
■ 真面目ゾーン(120-180文字、4-5文)
- 誠実で信頼性の高い理由
- 丁寧だが堅苦しくない表現
- 具体的な状況説明`,
  normal: `
■ 普通ゾーン(80-120文字、3-4文)
- 自然でバランスの取れた言い訳
- やや口語的でもOK`,
  light: `
■ ちょいふざけゾーン(60-100文字、2-3文)
- 少しユーモアを含む
- 若者言葉を適度に使用`,
  joke: `
■ 完全ネタゾーン(40-80文字、1-2文)
- 明らかに冗談だとわかる面白い言い訳
- パンチのある表現`,
  'ultra-serious': `
■ 超真面目ゾーン(150-200文字、5-6文)
- 成功率95%級の完璧な言い訳
- 論理的で隙がない
- 具体的なエピソードと感情を含める`,
  legendary: `
■ 伝説ゾーン(50-100文字、2-3文)
- 誰も思いつかないような斬新な言い訳
- インパクト重視
- 記憶に残る面白さ`,
};

// AIツッコミのサンプル（ゾーン別）
const aiCommentExamples: { [key: string]: string[] } = {
  serious: [
    'これは鉄板。でも次は遅刻すんなよ',
    '説得力あるけど、嘘は心が痛むぞ',
    '完璧。でも本当は正直が一番だぞ',
    '堅実な選択。リスクは低めだな',
  ],
  normal: [
    'まあ無難なライン。使えるかも',
    'バランス取れてるね。普通に通用しそう',
    '悪くない。でも念のため保険はかけとけ',
    '王道の言い訳。成功率60%ってとこか',
  ],
  light: [
    'その発想はなかった。先生信じるかな?',
    '攻めの言い訳。リスクもあるけどな',
    '面白いけど、ツッコまれたら終わりだぞ',
    'ギリギリのライン。雰囲気次第だな',
  ],
  joke: [
    'これ使ったら友達になれるか絶交されるかの二択',
    '正直に言った方がマシまである',
    '笑いは取れるけど許されはしない',
    'ネタとしては最高。実用性はゼロ',
  ],
  'ultra-serious': [
    'おめでとう。これは成功率99%の伝説級',
    'やばい、これガチで使えるやつだ',
    '完璧すぎる。でも使いすぎ注意な',
    '大当たり。これで乗り切れ',
  ],
  legendary: [
    '伝説降臨。SNSでバズる可能性あり',
    'これは歴史に残るレベル',
    '君、才能あるよ(AIだけど)',
    'インパクト強すぎ。語り継がれるぞ',
  ],
};

// ランダムなツッコミを取得（フォールバック用）
function getRandomComment(zoneId: string): string {
  const comments = aiCommentExamples[zoneId] || aiCommentExamples.normal;
  return comments[Math.floor(Math.random() * comments.length)];
}

const scenarioPrompts: { [key: number]: string } = {
  1: '学校に遅刻してしまいました。先生に伝える言い訳',
  2: '宿題や課題をやっていません。提出時に伝える言い訳',
  3: '授業をサボってしまいました。学校に伝える欠席理由',
  4: '友達からの遊びの誘いを断りたいです。角を立てずに断る言い訳',
  5: 'LINEの返信が遅れてしまいました。友達に伝える言い訳',
  6: '友達との約束をドタキャンまたは遅刻します。友達に伝える言い訳',
  7: 'デートを断りたいです。相手を傷つけずに断る言い訳',
  8: '告白の返事を保留したいです。もう少し考えたいと伝える言い訳',
  9: 'バイトを辞めたいです。店長や上司に伝える理由',
  10: 'バイトを急に休みたいです(当日欠勤)。店長に伝える言い訳',
};

export async function POST(request: NextRequest) {
  try {
    // APIキーをチェック
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEYが設定されていません' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const { scenarioId, level, rouletteMode, zoneId, zoneName } = await request.json();

    if (!scenarioId || !level) {
      return NextResponse.json(
        { error: 'scenarioIdとlevelは必須です' },
        { status: 400 }
      );
    }

    const scenarioPrompt = scenarioPrompts[scenarioId];
    if (!scenarioPrompt) {
      return NextResponse.json(
        { error: '無効なシチュエーションIDです' },
        { status: 400 }
      );
    }

    const levelInstruction = levelInstructions[level as keyof typeof levelInstructions];
    if (!levelInstruction) {
      return NextResponse.json(
        { error: '無効なレベルです' },
        { status: 400 }
      );
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (rouletteMode && zoneId) {
      // ルーレットモード用のプロンプト
      const zoneInstruction = zoneInstructions[zoneId];
      systemPrompt = `あなたは中高大学生の言い訳生成の専門家です。
状況に応じて説得力のある言い訳を生成してください。

【重要】
- 毎回違う構成・表現で生成してください
- AIっぽい硬い文章にならないよう注意
- 具体的なエピソードを含めてください
- 同じパターンや出だしを繰り返さないこと

【出力形式】
JSON形式で以下を返してください:
{
  "excuse": "生成された言い訳",
  "comment": "AIツッコミ(一言、「w」「ww」は使わない、短くパンチのある一言)"
}`;

      userPrompt = `【シチュエーション】
${scenarioPrompt}

【ゾーン】
${zoneName}

【指示】
このゾーンに応じた言い訳とAIツッコミを生成してください。

${zoneInstruction}

上記の条件に基づいて、言い訳とツッコミをJSON形式で生成してください。`;
    } else {
      // 通常モード用のプロンプト
      systemPrompt = `あなたは言い訳生成の専門家です。
状況に応じて説得力のある言い訳を生成してください。

【出力形式】
- 3-5文
- 100-200文字
- 自然な日本語
- 具体的なエピソードを含む
- 言い訳のテキストのみを出力し、余計な説明は不要です`;

      userPrompt = `【シチュエーション】
${scenarioPrompt}

【レベル指示】
${levelInstruction}

上記の条件に基づいて、言い訳を生成してください。`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const rawResponse = message.content[0].type === 'text' ? message.content[0].text : '';

    if (rouletteMode && zoneId) {
      // ルーレットモード: JSON形式のレスポンスをパース
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            excuse: parsed.excuse || rawResponse,
            comment: parsed.comment || getRandomComment(zoneId),
            scenarioId,
            level,
          });
        } else {
          // JSONが見つからない場合はフォールバック
          return NextResponse.json({
            excuse: rawResponse,
            comment: getRandomComment(zoneId),
            scenarioId,
            level,
          });
        }
      } catch (error) {
        // パースエラーの場合はフォールバック
        console.error('JSON parse error:', error);
        return NextResponse.json({
          excuse: rawResponse,
          comment: getRandomComment(zoneId),
          scenarioId,
          level,
        });
      }
    } else {
      // 通常モード
      return NextResponse.json({
        excuse: rawResponse,
        scenarioId,
        level,
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '言い訳の生成に失敗しました' },
      { status: 500 }
    );
  }
}
