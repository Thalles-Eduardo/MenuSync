import type { CSSProperties } from "react";
import styles from "./Timeline.module.css";
import { MILESTONES } from "./about-data";

export default function Timeline() {
  return (
    <div
      className={styles.cardsContainer}
      style={{ "--items": MILESTONES.length } as CSSProperties}
      aria-label="Linha do tempo do restaurante"
    >
      <ul className={styles.cards}>
        {MILESTONES.map((m, i) => (
          <li key={m.year} style={{ "--i": i } as CSSProperties}>
            <input
              type="radio"
              id={`about-tl-${i}`}
              name="about-timeline"
              defaultChecked={i === 0}
            />
            <label htmlFor={`about-tl-${i}`}>{m.year}</label>
            <h2>{m.year}</h2>
            <p>
              <span className={styles.itemTitle}>{m.title}</span>
              {m.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
