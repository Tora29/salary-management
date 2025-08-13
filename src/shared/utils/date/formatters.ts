import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export const formatDate = (date: Date | string, formatStr: string = 'yyyy年MM月dd日'): string => {
	const parsedDate = typeof date === 'string' ? parseISO(date) : date;
	return format(parsedDate, formatStr, { locale: ja });
};

export const formatYearMonth = (date: Date | string): string => {
	const parsedDate = typeof date === 'string' ? parseISO(date) : date;
	return format(parsedDate, 'yyyy-MM');
};

export const formatMonthDay = (date: Date | string): string => {
	const parsedDate = typeof date === 'string' ? parseISO(date) : date;
	return format(parsedDate, 'MM月dd日', { locale: ja });
};

export const formatRelativeTime = (date: Date | string): string => {
	const parsedDate = typeof date === 'string' ? parseISO(date) : date;
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return 'たった今';
	} else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes}分前`;
	} else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours}時間前`;
	} else if (diffInSeconds < 604800) {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days}日前`;
	} else {
		return formatDate(parsedDate, 'yyyy/MM/dd');
	}
};
