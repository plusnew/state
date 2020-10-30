import type { idTemplate } from "../types/";

export default function idSerializer(id: idTemplate): string {
  if (typeof id === "string") {
    return `"${id}"`;
  } else if (typeof id === "number") {
    return `${id}`;
  } else if (typeof id === "object") {
    return `{${Object.keys(id)
      .sort()
      .map((key) => `${key}:${idSerializer(id[key])}`)
      .join(",")}}`;
  }
  throw new Error("Not a valid type");
}
