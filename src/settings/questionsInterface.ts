import { Cacheable } from "../util/cache";

type answerTypeOptions = "short" | "long" | "radio" | "multi" | "dropdown" | "number" | "file" | "tick";

export interface IApplicationQuestion extends Cacheable {
  questionText: string;
  answerType: answerTypeOptions;
  answerOptions?: Array<string>;
  required: boolean;
}

export interface IApplicationSection extends Cacheable {
  name: string;
  questions: Array<IApplicationQuestion>;
}