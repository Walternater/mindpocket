export type Locale = "zh" | "en"

export type DeepTranslationRecord<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepTranslationRecord<U>[]
    : T extends object
      ? { [K in keyof T]: DeepTranslationRecord<T[K]> }
      : T
