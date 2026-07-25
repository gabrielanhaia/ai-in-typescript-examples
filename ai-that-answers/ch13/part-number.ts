const PART = /^[A-Z]{3}-\d{4}$/;

export const isPartNumber = (value: string) => PART.test(value);
