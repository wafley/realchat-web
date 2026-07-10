import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="space-y-6 text-center">
      <div className="rounded-full bg-accent/10 p-3 mx-auto w-fit">
        <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Forgot Password</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact your administrator to reset your password.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card/50 p-4 text-sm">
        <p className="text-muted-foreground">Email:</p>
        <p className="font-medium text-card-foreground">admin@hallowok.com</p>
      </div>
      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-2 w-full rounded-md bg-[#2a313b] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#2a313b]/80"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
