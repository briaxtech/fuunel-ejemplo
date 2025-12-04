import { formCases } from "./formCases";
import { AiTestCase } from "./types";

const catalog: AiTestCase[] = [...formCases];

export const listCases = () => catalog;

export const filterCases = (tags: string[] | undefined, match: string | undefined) =>
  catalog.filter((test) => {
    const tagOk = !tags || tags.length === 0 || tags.some((t) => test.tags?.includes(t));
    const matchOk =
      !match ||
      test.id.toLowerCase().includes(match.toLowerCase()) ||
      test.name.toLowerCase().includes(match.toLowerCase());
    return tagOk && matchOk;
  });
