import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// .envファイルを読み込み
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service Roleキーを使用してSupabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🚀 テストユーザーの作成を開始します...');

  const testUsers = [
    {
      email: 'test1@example.com',
      password: 'password123',
      user_metadata: {
        name: '田中 太郎',
        profile_id: '11111111-1111-1111-1111-111111111111'
      }
    },
    {
      email: 'test2@example.com',
      password: 'password123',
      user_metadata: {
        name: '佐藤 花子',
        profile_id: '22222222-2222-2222-2222-222222222222'
      }
    }
  ];

  for (const user of testUsers) {
    try {
      // ユーザーを作成（Service Roleキーを使用）
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // メール確認をスキップ
        user_metadata: user.user_metadata
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${user.email} は既に存在します`);
        } else {
          console.error(`❌ ${user.email} の作成に失敗:`, error.message);
        }
      } else {
        console.log(`✅ ${user.email} を作成しました`);
        console.log(`   ID: ${data.user?.id}`);
      }
    } catch (err) {
      console.error(`❌ エラーが発生しました:`, err);
    }
  }

  console.log('\n📋 テストユーザー情報:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: test1@example.com');
  console.log('Password: password123');
  console.log('名前: 田中 太郎');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: test2@example.com');
  console.log('Password: password123');
  console.log('名前: 佐藤 花子');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createTestUsers()
  .then(() => {
    console.log('\n✨ 処理が完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });