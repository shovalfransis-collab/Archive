import LoginForm from '@/components/LoginForm';
import { safeNextPath } from '@/lib/safeRedirect';

// The PIN screen. If you were sent here on the way to another page (the
// proxy adds ?next=/that/page), you go back there after logging in — but
// only if it's a page on this site, never another website.
export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return <LoginForm nextPath={safeNextPath(Array.isArray(next) ? next[0] : next)} />;
}
