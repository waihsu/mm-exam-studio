export { getQuestionById, getQuestions } from "./question-read-list.service";
export { getQuestionMeta } from "./question-read-meta.service";
import { clearQuestionListCache } from "./question-read-list.service";
import { clearQuestionMetaCache } from "./question-read-meta.service";

export const invalidateQuestionReadCaches = () => {
  clearQuestionMetaCache();
  clearQuestionListCache();
};
