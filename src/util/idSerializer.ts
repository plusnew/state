import type { idTemplate } from "../types/";

export default function idSerializer(id: idTemplate): string {
  if (typeof id === "string") {
    return `"${id}"`;
  } else if (typeof id === "number") {
    return `${id}`;
  } else if (typeof id === "boolean") {
    return `${id.toString()}`;
  } else if (typeof id === "object") {
    return `{${Object.keys(id)
      .sort()
      .map((key) => {
        const value = id[key];
        return `${key}:${value === null ? "null" : idSerializer(value)}`;
      })
      .join(",")}}`;
  }
  throw new Error("Not a valid type");
}
