import { requiredFieldProgress } from "./domain.js";

export default function QuestionnaireProgress({ product, answers }) {
  const { total, remaining } = requiredFieldProgress(product, answers);
  const filledPercent = total ? ((total - remaining) / total) * 100 : 0;

  return (
    <span role="status">
      Осталось заполнить:{" "}
      <span
        className="ql-required-count"
        style={{ "--ql-required-filled": `${filledPercent}%` }}
      >
        {remaining}
      </span>{" "}
      из {total}
    </span>
  );
}
