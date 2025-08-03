/**
 * Tableコンポーネントのユニットテスト
 * @module TableTest
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import Table from '../ui/Table.svelte';
import type { Column } from '../model/types';

/**
 * Tableコンポーネントのテストスイート
 * テーブルの表示、エンプティステート、null値の処理を検証
 */
describe('Table', () => {
  /**
   * テスト用のデータ型定義
   */
  interface TestData extends Record<string, unknown> {
    name: string;
    age: number;
    city: string;
  }

  /**
   * テスト用のモック列定義
   * 日本語のラベルを使用して実際の使用例を再現
   */
  const mockColumns: Column[] = [
    { key: 'name', label: '名前' },
    { key: 'age', label: '年齢' },
    { key: 'city', label: '都市' }
  ];

  /**
   * テーブルヘッダーが正しくレンダリングされることを検証
   */
  it('renders table headers correctly', () => {
    const { container } = render(Table, { 
      columns: mockColumns,
      data: [] 
    });
    const headers = container.querySelectorAll('th');
    
    expect(headers[0]).toHaveTextContent('名前');
    expect(headers[1]).toHaveTextContent('年齢');
    expect(headers[2]).toHaveTextContent('都市');
  });

  /**
   * データが空の場合のメッセージ表示を検証
   */
  it('renders empty state when no data provided', () => {
    const { container } = render(Table, { 
      columns: mockColumns, 
      data: [] 
    });
    
    expect(container.textContent).toContain('データがありません');
  });

  /**
   * データが正しく表示されることを検証
   */
  it('renders data correctly', () => {
    const mockData: TestData[] = [
      { name: '太郎', age: 25, city: '東京' },
      { name: '花子', age: 30, city: '大阪' }
    ];

    const { container } = render(Table, { 
      columns: mockColumns, 
      data: mockData 
    });
    const rows = container.querySelectorAll('tbody tr');
    
    expect(rows.length).toBe(2);
    expect(rows[0]).toHaveTextContent('太郎');
    expect(rows[0]).toHaveTextContent('25');
    expect(rows[0]).toHaveTextContent('東京');
    expect(rows[1]).toHaveTextContent('花子');
    expect(rows[1]).toHaveTextContent('30');
    expect(rows[1]).toHaveTextContent('大阪');
  });

  /**
   * null/undefined値が適切に処理されることを検証
   */
  it('handles null and undefined values gracefully', () => {
    // Partial型を使用して、一部のプロパティのみを持つオブジェクトを作成
    const mockData = [
      { city: '京都' } as TestData
    ];
    
    const { container } = render(Table, { 
      columns: mockColumns, 
      data: mockData 
    });
    const cells = container.querySelectorAll('tbody td');
    
    expect(cells[0]).toHaveTextContent('-');
    expect(cells[1]).toHaveTextContent('-');
    expect(cells[2]).toHaveTextContent('京都');
  });

  /**
   * カスタムエンプティメッセージが表示されることを検証
   */
  it('displays custom empty message when no data', () => {
    const { container } = render(Table, { 
      columns: mockColumns, 
      data: [],
      emptyMessage: 'カスタムメッセージ'
    });
    
    expect(container.textContent).toContain('カスタムメッセージ');
  });
});