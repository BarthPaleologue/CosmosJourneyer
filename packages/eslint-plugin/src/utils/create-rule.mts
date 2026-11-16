import { ESLintUtils } from "@typescript-eslint/utils";

const documentationUrlBase =
    "https://github.com/BarthPaleologue/CosmosJourneyer/blob/main/packages/eslint-plugin/docs/rules";

/**
 * Creates a rule whose documentation URL points at the local plugin documentation.
 */
export const createRule = ESLintUtils.RuleCreator((ruleName) => `${documentationUrlBase}/${ruleName}.md`);
