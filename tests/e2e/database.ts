export const sql = async (
  query: string,
): Promise<{ rows: Record<string, unknown>[] }[]> => {
  const response = await fetch("http://127.0.0.1:5174/api/testing/sql", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.E2E_DB_TOKEN}` },
    body: query,
  });
  if (!response.ok) throw new Error(`Local SQL failed: ${response.status}`);
  return response.json();
};
