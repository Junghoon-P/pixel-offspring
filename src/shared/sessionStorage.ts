// 보조 상태 저장 실패가 서버 저장·화면 이동을 중단하지 않도록 격리한다.
export const readSessionValue = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
export const writeSessionValue = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* 현재 화면은 계속 사용할 수 있다. */
  }
};
export const removeSessionValue = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* 서버의 저장 성공은 취소되지 않는다. */
  }
};
