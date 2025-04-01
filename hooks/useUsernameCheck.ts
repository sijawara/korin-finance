import useSWR from "swr";

interface UsernameCheckResponse {
  username: string;
  isTaken: boolean;
}

const fetcher = async (url: string): Promise<UsernameCheckResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to check username availability");
  }
  return response.json();
};

/**
 * Custom hook to check if a username is available.
 * @param username - The username to check
 * @returns Object containing isAvailable boolean and isLoading state
 */
export function useUsernameCheck(username: string) {
  const { data, error } = useSWR<UsernameCheckResponse>(
    username
      ? `${
          process.env.NEXT_PUBLIC_SSO_URL
        }/api/profile/username/check?username=${encodeURIComponent(username)}`
      : null,
    fetcher
  );

  return {
    isAvailable: data?.isTaken === false,
    isLoading: !error && !data,
    isError: error,
  };
}
