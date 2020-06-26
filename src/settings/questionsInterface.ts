import { Cacheable } from '../util/cache';

type answerTypeOptions = 'short' | 'long' | 'radio' | 'multi' | 'dropdown' | 'number' | 'file' | 'tick';

export interface ApplicationQuestionInterface extends Cacheable {
	questionName: string;
	questionText: string;
	maxLength: number; // Only applies to 'long' answers
	answerType: answerTypeOptions;
	answerOptions?: Array<string>;
	answerLink?: string;
	required: boolean;
}

export interface ApplicationSectionInterface extends Cacheable {
	name: string;
	questions: Array<ApplicationQuestionInterface>;
}
