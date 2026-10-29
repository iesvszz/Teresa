import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="section">
      <div className="container narrow">
        <h1>Page not found</h1>
        <p className="lead">That page does not exist.</p>
        <Link to="/" className="btn btn-primary">Back to TERESA</Link>
      </div>
    </section>
  );
}
