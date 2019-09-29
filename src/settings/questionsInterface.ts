import { Cacheable } from "../util/cache";

type answerTypeOptions = "short" | "long" | "radio" | "multi" | "dropdown" | "number" | "file" | "tick";

export interface IApplicationQuestion extends Cacheable {
  questionName: string;
  questionText: string;
  answerType: answerTypeOptions;
  answerOptions?: Array<string>;
  answerLink?: string;
  required: boolean;
}

export interface IApplicationSection extends Cacheable {
  name: string;
  questions: Array<IApplicationQuestion>;
}