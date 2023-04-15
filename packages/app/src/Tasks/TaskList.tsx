import useLogin from "Hooks/useLogin";
import { useUserProfile } from "Hooks/useUserProfile";
import Icon from "Icons/Icon";
import { useState } from "react";
import { UITask } from "Tasks";
import { Nip5Task } from "./Nip5Task";

const AllTasks: Array<UITask> = [new Nip5Task()];
AllTasks.forEach(a => a.load());

export const TaskList = () => {
  const publicKey = useLogin().publicKey;
  const user = useUserProfile(publicKey);
  const [, setTick] = useState<number>(0);

  function muteTask(t: UITask) {
    t.mute();
    setTick(x => (x += 1));
  }

  return (
    <>
      {AllTasks.filter(a => (user ? a.check(user) : false)).map(a => {
        return (
          <div key={a.id} className="card">
            <div className="header">
              <Icon name="lightbulb" />
              <div className="close" onClick={() => muteTask(a)}>
                <Icon name="close" size={14} />
              </div>
            </div>
            {a.render()}
          </div>
        );
      })}
    </>
  );
};
