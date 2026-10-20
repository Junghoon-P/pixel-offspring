import { z } from "zod";
const schema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => /^postgres(ql)?:\/\//.test(value)),
  APP_ORIGIN: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.origin === value &&
        !url.username &&
        !url.password
      );
    }),
  CREATION_ENABLED: z.enum(["true", "false"]).default("false"),
  CRON_SECRET: z.string().min(32),
});
export interface RuntimeConfig {
  DATABASE_URL: string;
  APP_ORIGIN: string;
  CREATION_ENABLED: string;
  CRON_SECRET: string;
}
export const readConfig = (
  values: Record<string, string | undefined>,
): RuntimeConfig => {
  const isPreview = values.VERCEL === "1" && values.VERCEL_ENV === "preview";
  const host = z
    .string()
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/)
    .safeParse(values.VERCEL_URL);
  if (isPreview && !host.success)
    throw new Error("Server environment is not configured");
  const result = schema.safeParse({
    ...values,
    APP_ORIGIN:
      isPreview && host.success ? `https://${host.data}` : values.APP_ORIGIN,
  });
  if (!result.success) throw new Error("Server environment is not configured");
  return result.data;
};
