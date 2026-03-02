import { Question } from "@/types/question";
import { existenceOfGodQuestions } from "./existence-of-god";
import { bibleReliabilityQuestions } from "./bible-reliability";
import { jesusDietyResurrectionQuestions } from "./jesus-deity-resurrection";
import { problemOfEvilQuestions } from "./problem-of-evil";
import { scienceAndFaithQuestions } from "./science-and-faith";
import { comparativeReligionQuestions } from "./comparative-religion";
import { christianEthicsQuestions } from "./christian-ethics";
import { salvationAndGraceQuestions } from "./salvation-and-grace";
import { churchAndWorshipQuestions } from "./church-and-worship";
import { meaningAndPurposeQuestions } from "./meaning-and-purpose";
import { prayerQuestions } from "./prayer";
import { afterlifeQuestions } from "./afterlife";
import { trinityQuestions } from "./trinity";
import { holySpiritQuestions } from "./holy-spirit";
import { creationAndEvolutionQuestions } from "./creation-and-evolution";
import { extendedLibraryQuestions } from "./extended-library";

export const allQuestions: Question[] = [
  ...existenceOfGodQuestions,
  ...bibleReliabilityQuestions,
  ...jesusDietyResurrectionQuestions,
  ...problemOfEvilQuestions,
  ...scienceAndFaithQuestions,
  ...comparativeReligionQuestions,
  ...christianEthicsQuestions,
  ...salvationAndGraceQuestions,
  ...churchAndWorshipQuestions,
  ...meaningAndPurposeQuestions,
  ...prayerQuestions,
  ...afterlifeQuestions,
  ...trinityQuestions,
  ...holySpiritQuestions,
  ...creationAndEvolutionQuestions,
  ...extendedLibraryQuestions,
];
