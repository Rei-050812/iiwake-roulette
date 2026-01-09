import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const levelInstructions = {
  serious: '誠実で信頼性の高い理由を作成してください。真面目で説得力のある内容にしてください。',
  normal: '自然でバランスの取れた言い訳を作成してください。現実的で納得しやすい内容にしてください。',
  light: '少しユーモアを含む言い訳を作成してください。軽めですが使える内容にしてください。',
  joke: '明らかに冗談だとわかる面白い言い訳を作成してください。クスッと笑える内容にしてください。',
};

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

    const { scenarioId, level } = await request.json();

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

    const systemPrompt = `あなたは言い訳生成の専門家です。
状況に応じて説得力のある言い訳を生成してください。

【出力形式】
- 3-5文
- 100-200文字
- 自然な日本語
- 具体的なエピソードを含む
- 言い訳のテキストのみを出力し、余計な説明は不要です`;

    const userPrompt = `【シチュエーション】
${scenarioPrompt}

【レベル指示】
${levelInstruction}

上記の条件に基づいて、言い訳を生成してください。`;

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

    const excuse = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      excuse,
      scenarioId,
      level,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '言い訳の生成に失敗しました' },
      { status: 500 }
    );
  }
}
