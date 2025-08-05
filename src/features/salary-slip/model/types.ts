export interface FileDropZoneProps {
	onFileSelect: (file: File) => void;
	isProcessing?: boolean;
	error?: string | null;
}
