export function createSessionFence(readToken) {
  let version = 0;
  let refreshedToken = null;
  let sessionTokens = new Set();
  const capture = () => ({ version, token: readToken() || null });
  const isCurrent = snapshot => !snapshot || (
    snapshot.version === version && (
      snapshot.token === (readToken() || null) ||
      (refreshedToken === readToken() && sessionTokens.has(snapshot.token))
    )
  );
  const assertCurrent = snapshot => {
    if (!isCurrent(snapshot)) {
      const error = new Error("Esta requisição pertence a uma sessão anterior.");
      error.code = "ERR_SESSION_CHANGED";
      throw error;
    }
  };
  const recordRefresh = (snapshot, token) => {
    assertCurrent(snapshot);
    sessionTokens.add(snapshot.token);
    sessionTokens.add(token);
    refreshedToken = token;
  };
  const advance = () => {
    refreshedToken = null;
    sessionTokens = new Set();
    return ++version;
  };
  return { capture, isCurrent, assertCurrent, recordRefresh, advance, isVersion: value => value === version, version: () => version };
}

export function assertLoginIdentity(email, payload, user) {
  const normalized = value => String(value || "").trim().toLowerCase();
  if (!payload?.accessToken || !user?.id || !normalized(email) || normalized(email) !== normalized(user.email) || (payload.user?.id && payload.user.id !== user.id)) {
    throw new Error("Não foi possível confirmar a identidade desta sessão. Entre novamente.");
  }
}
