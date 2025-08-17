import type { ExtractedSalaryData, SalarySlip } from '../model/types';

export async function saveSalarySlip(
	data: ExtractedSalaryData & { userId: string; pdfFileId?: string }
): Promise<{ success: boolean; salaryId?: string; error?: string }> {
	try {
		const response = await fetch('/api/salary/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		const result = await response.json();
		return result;
	} catch (error) {
		console.error('Failed to save salary slip:', error);
		return { success: false, error: 'Failed to save salary slip' };
	}
}

export async function getSalarySlips(userId: string): Promise<SalarySlip[]> {
	try {
		const response = await fetch(`/api/salary/slips?userId=${userId}`);
		if (!response.ok) {
			throw new Error('Failed to fetch salary slips');
		}
		return await response.json();
	} catch (error) {
		console.error('Failed to fetch salary slips:', error);
		return [];
	}
}

export async function deleteSalarySlip(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch(`/api/salary/slips/${id}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			throw new Error('Failed to delete salary slip');
		}

		return { success: true };
	} catch (error) {
		console.error('Failed to delete salary slip:', error);
		return { success: false, error: 'Failed to delete salary slip' };
	}
}
