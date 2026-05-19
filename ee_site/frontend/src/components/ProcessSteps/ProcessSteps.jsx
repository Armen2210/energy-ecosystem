// =========================================================
// PROCESS STEPS / ЭТАПЫ ПРОЦЕССА
// Универсальный компонент для отображения этапов работы.
// Сейчас используется для производственного процесса.
// =========================================================

function ProcessSteps({ steps }) {
  return (
    <div className="process-list">
      {steps.map((step, index) => (
        <article className="process-item" key={step.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>

          <div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default ProcessSteps;