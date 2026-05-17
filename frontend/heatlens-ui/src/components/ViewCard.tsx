import type { ViewSummary } from "../types/viewTypes";

type ViewCardProps = {
  view: ViewSummary;
};

function ViewCard({ view }: ViewCardProps) {
  return (
    <article className="view-card">
      <p className="view-status">{view.status}</p>
      <h3>{view.title}</h3>
      <p>{view.description}</p>
    </article>
  );
}

export default ViewCard;
