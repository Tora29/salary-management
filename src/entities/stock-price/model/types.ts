export interface StockQuote {
	symbol: string;
	regularMarketPrice: number;
	regularMarketChange: number;
	regularMarketChangePercent: number;
	regularMarketTime: Date;
	currency: string;
	marketState: 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';
}

export interface StockPriceError {
	symbol: string;
	error: string;
}

export interface StockPriceResponse {
	quotes: StockQuote[];
	errors: StockPriceError[];
}
