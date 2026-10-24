import { useState } from "react";
import { ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";

type Scene = {
  time: string;
  title: string;
  prompt: string;
  choices: { label: string; feedback: string }[];
};

const scenes: Scene[] = [
  {
    time: "10 am",
    title: "Clarify the brief",
    prompt:
      "A college club says: “Make our event signup cool.” What is the first useful move?",
    choices: [
      {
        label: "Ask what success looks like and who needs to sign up.",
        feedback:
          "Strong start. A vague brief needs a goal and audience before visuals can be judged.",
      },
      {
        label: "Copy a competitor’s signup page.",
        feedback:
          "This can provide references, but it does not explain this club’s goal, audience, or constraints.",
      },
      {
        label: "Start choosing colours and animations.",
        feedback:
          "Visual exploration can wait. Without the purpose, polished work may solve the wrong problem.",
      },
    ],
  },
  {
    time: "11 am",
    title: "Choose the flow",
    prompt:
      "The organizer wants attendee details. What trade-off should the team discuss?",
    choices: [
      {
        label:
          "A short form may improve completion; a longer form collects more detail.",
        feedback:
          "Exactly. The choice is not just “simple versus complete”—it is what information is necessary for the event.",
      },
      {
        label: "Use the longest form so nothing is missed.",
        feedback:
          "More fields can reduce completion and create privacy obligations. Ask what is truly needed.",
      },
      {
        label: "Use no form at all.",
        feedback:
          "That avoids friction, but it may make it impossible to run the event responsibly. Find the smallest useful set.",
      },
    ],
  },
  {
    time: "1 pm",
    title: "Review an AI draft",
    prompt:
      "An AI draft adds a phone field and uses low-contrast labels. What do you do?",
    choices: [
      {
        label: "Revise it: remove unnecessary data and improve contrast.",
        feedback:
          "Good review. AI output is a proposal; the team still owns privacy, accessibility, and the actual brief.",
      },
      {
        label: "Keep it because it arrived quickly.",
        feedback:
          "Speed does not make a field necessary or a low-contrast control usable. Review the output before shipping.",
      },
      {
        label: "Ask for three alternatives, then choose without checking.",
        feedback:
          "Alternatives can help, but a human still needs criteria: necessity, clarity, accessibility, and the event goal.",
      },
    ],
  },
  {
    time: "3 pm",
    title: "Test the flow",
    prompt: "A fictional tester cannot find Submit. What is the next move?",
    choices: [
      {
        label: "Make the action clearer, then ask another person to try again.",
        feedback:
          "That connects an observation to a change and a retest instead of treating one comment as a final answer.",
      },
      {
        label: "Explain where Submit is.",
        feedback:
          "If explanation is required, the flow is probably not doing enough on its own. Learn from the confusion.",
      },
      {
        label: "Add more copy everywhere.",
        feedback:
          "More copy can create new noise. First find the specific missing signal or hierarchy issue.",
      },
    ],
  },
  {
    time: "4 pm",
    title: "Cut scope",
    prompt: "The deadline moved forward. What should the team decide together?",
    choices: [
      {
        label:
          "Cut animation before clarity, error states, or the core signup path.",
        feedback:
          "A sensible trade-off. Protect the important path and explain remaining risk in the handoff.",
      },
      {
        label: "Drop error handling so the page looks finished.",
        feedback:
          "That makes a fragile experience look complete. Error states are part of the core flow.",
      },
      {
        label: "Delay without explaining what changed.",
        feedback:
          "Sometimes a delay is right, but a team needs to name the impact, options, and ownership.",
      },
    ],
  },
];

export function DesignerDay() {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [handoff, setHandoff] = useState("");
  const [enjoyed, setEnjoyed] = useState("");
  const [frustrated, setFrustrated] = useState("");
  const scene = scenes[step];
  const choice = choices[step];
  const finished = step === scenes.length;
  const select = (index: number) =>
    setChoices((current) =>
      current.length === step ? [...current, index] : current,
    );
  const reset = () => {
    setStep(0);
    setChoices([]);
    setReasons([]);
    setHandoff("");
    setEnjoyed("");
    setFrustrated("");
  };

  return (
    <section
      className="mt-8 rounded-[1.8rem] border border-primary/25 bg-[#e7eee7] p-6 sm:p-8"
      data-testid="section-designer-day"
    >
      <p className="mono flex items-center gap-2 text-[9px] uppercase tracking-[.18em] text-primary">
        <Sparkles size={13} /> A playable designer day
      </p>
      <h2 className="serif mt-3 text-4xl leading-tight">
        Try five small decisions.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        A fictional college club needs a mobile event signup before tonight.
        This is exposure, not a hiring test or resume experience. There is no
        score and no career verdict. Your choices and notes stay in this page
        only.
      </p>
      {!finished && scene ? (
        <div
          className="mt-6 rounded-[1.5rem] border border-border bg-card/85 p-5 sm:p-7"
          data-testid={`designer-day-scene-${step + 1}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="mono text-[10px] uppercase tracking-[.15em] text-primary">
              {scene.time} · decision {step + 1} of {scenes.length}
            </span>
            <span className="text-xs text-muted-foreground">
              15-minute fictional brief
            </span>
          </div>
          <h3 className="serif mt-5 text-3xl">{scene.title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/80">
            {scene.prompt}
          </p>
          {step === 2 && (
            <div className="mt-4 rounded-xl border border-dashed border-border p-4">
              <p className="text-xs font-semibold">
                Sample AI draft — prewritten illustration, not live generation
              </p>
              <p className="mt-2 text-sm">
                Event signup → Name → Email → Phone number (required) → Submit
              </p>
              <p className="mt-2 text-xs">
                Design note: pale grey labels on a white background. Inspect
                necessity and readability before accepting this draft.
              </p>
            </div>
          )}
          <label className="mt-4 block text-sm">
            Why would you make this choice? (Optional)
            <textarea
              maxLength={1000}
              value={reasons[step] || ""}
              onChange={(event) =>
                setReasons((current) => {
                  const next = [...current];
                  next[step] = event.target.value;
                  return next;
                })
              }
              className="mt-2 block w-full rounded-xl border border-border bg-card p-3"
              rows={2}
            />
          </label>
          <div className="mt-6 grid gap-3">
            {scene.choices.map((item, index) => (
              <button
                type="button"
                key={item.label}
                disabled={choice !== undefined}
                onClick={() => select(index)}
                className={`rounded-2xl border p-4 text-left text-sm leading-6 transition disabled:cursor-default ${choice === index ? "border-primary bg-primary text-primary-foreground" : choice !== undefined ? "border-border bg-background/40 opacity-55" : "border-border bg-background/60 hover:border-primary/50"}`}
                data-testid={`button-designer-choice-${step + 1}-${index + 1}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {choice !== undefined && (
            <div
              className="mt-5 rounded-2xl border border-primary/20 bg-[#f4ead6] p-4 text-sm leading-6 text-foreground/85"
              data-testid="text-designer-feedback"
            >
              <b className="block text-primary">What this reveals</b>
              {scene.choices[choice].feedback}
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Next decision <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="mt-6 space-y-5 rounded-[1.5rem] border border-primary/25 bg-card/85 p-6 sm:p-8"
          data-testid="section-designer-debrief"
        >
          <div className="flex items-center gap-3 text-primary">
            <Check size={19} /> Debrief, not a verdict
          </div>
          <h3 className="serif text-3xl">Two things you actually tried</h3>
          {[0, 2].map((index) => (
            <div
              key={index}
              className="rounded-xl bg-secondary p-4 text-sm leading-6"
            >
              <b>{scenes[index].title}</b>
              <p>You chose: “{scenes[index].choices[choices[index]].label}”</p>
              <p>{scenes[index].choices[choices[index]].feedback}</p>
              {reasons[index] && (
                <p className="mt-2">Your reasoning: “{reasons[index]}”</p>
              )}
            </div>
          ))}
          <label className="block text-sm">
            Handoff to your fictional developer: what is in scope, what was cut,
            and what needs checking?
            <textarea
              maxLength={2000}
              value={handoff}
              onChange={(event) => setHandoff(event.target.value)}
              rows={3}
              className="mt-2 block w-full rounded-xl border border-border bg-card p-3"
            />
          </label>
          <label className="block text-sm">
            What did you enjoy?
            <textarea
              maxLength={1000}
              value={enjoyed}
              onChange={(event) => setEnjoyed(event.target.value)}
              rows={2}
              className="mt-2 block w-full rounded-xl border border-border bg-card p-3"
            />
          </label>
          <label className="block text-sm">
            What frustrated you?
            <textarea
              maxLength={1000}
              value={frustrated}
              onChange={(event) => setFrustrated(event.target.value)}
              rows={2}
              className="mt-2 block w-full rounded-xl border border-border bg-card p-3"
            />
          </label>
          <p className="text-sm leading-6 text-muted-foreground">
            These are observations about this exercise, not proof of ability or
            a career verdict. If the process felt interesting, try a small
            real-world practice project. If it did not, explore another role.
            You need more evidence before deciding.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-card px-4 py-2 text-xs font-semibold text-primary"
            data-testid="button-restart-designer-day"
          >
            <RotateCcw size={14} /> Try it again
          </button>
        </div>
      )}
    </section>
  );
}
