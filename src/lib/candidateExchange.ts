export type CandidateExchangeMessage = {
  expedition_id?: string | null;
  automated?: boolean | null;
};

export const isCandidateExchangeClosed = (status?: string | null) => status === "refusee";

export const hasHumanCompanyMessage = (
  messages: CandidateExchangeMessage[],
  talentUserId: string,
) => messages.some((message) => message.expedition_id !== talentUserId && message.automated !== true);

export const canTalentReplyToExchange = (
  messages: CandidateExchangeMessage[],
  talentUserId: string,
  candidatureStatus?: string | null,
) => !isCandidateExchangeClosed(candidatureStatus) && hasHumanCompanyMessage(messages, talentUserId);
