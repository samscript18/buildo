import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container">
      <h1>This door leads nowhere.</h1>
      <p>We couldn’t find that page.</p>
      <Link className="button" href="/">
        Back to Buildo
      </Link>
    </div>
  );
}
