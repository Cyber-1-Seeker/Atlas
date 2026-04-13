import client from './client.ts';

export interface MuscleGroup {
    id:number; key:string; name:string; name_en:string; body_region:string;
    emoji:string; image_url:string|null;
    description:string; functions:string; daily_life:string;
    benefits:string; posture_role:string; order:number;
}
export interface ExerciseMuscle { id:number; muscle:MuscleGroup; intensity:1|2|3|4; }
export interface Exercise {
    id:number; name:string; slug:string; category:string; equipment:string; emoji:string;
    description:string; how_to:string; benefits:string; tips:string; common_mistakes:string;
    image_url:string|null; gif_url:string|null; video_url:string;
    extra_links:{title:string;url:string}[];
    muscles:ExerciseMuscle[]; primary_muscle?:ExerciseMuscle; is_published:boolean;
}
export interface DayExercise { id:number; exercise:Exercise; order:number; sets_count:number; reps_hint:string; notes:string; }
export interface DaySection  { id:number; title:string; order:number; exercises:DayExercise[]; }
export interface TrainingDay { id:number; name:string; week_index:number; day_index:number; order:number; rest_day:boolean; sections:DaySection[]; }
export interface MuscleScore { muscle:MuscleGroup; score:number; level:'high'|'medium'|'low'; }
export interface TrainingProgram {
    id:number; name:string; description:string; weeks_count:number; is_active:boolean;
    created_at:string; days:TrainingDay[]; days_count?:number;
    muscle_coverage:MuscleScore[]; uncovered_muscles:MuscleGroup[];
}
export interface SessionSet { id:number; day_exercise:number; set_number:number; weight:number; reps:number; orm:number; recorded_at:string; }
export interface WorkoutSession { id:number; day:number|null; date:string; started:string; ended:string|null; notes:string; sets:SessionSet[]; }

const B = '/fitness';
export const fitnessApi = {
    getMuscles:       (p?:Record<string,string>) => client.get<MuscleGroup[]>(`${B}/muscles/`,{params:p}),
    getMuscle:        (id:number) => client.get<MuscleGroup>(`${B}/muscles/${id}/`),
    createMuscle:     (d:FormData) => client.post<MuscleGroup>(`${B}/muscles/`,d,{headers:{'Content-Type':'multipart/form-data'}}),
    updateMuscle:     (id:number,d:FormData) => client.patch<MuscleGroup>(`${B}/muscles/${id}/`,d,{headers:{'Content-Type':'multipart/form-data'}}),
    deleteMuscle:     (id:number) => client.delete(`${B}/muscles/${id}/`),

    getExercises:     (p?:Record<string,string>) => client.get<Exercise[]>(`${B}/exercises/`,{params:p}),
    getExercise:      (id:number) => client.get<Exercise>(`${B}/exercises/${id}/`),
    createExercise:   (d:FormData) => client.post<Exercise>(`${B}/exercises/`,d,{headers:{'Content-Type':'multipart/form-data'}}),
    updateExercise:   (id:number,d:FormData) => client.patch<Exercise>(`${B}/exercises/${id}/`,d,{headers:{'Content-Type':'multipart/form-data'}}),
    deleteExercise:   (id:number) => client.delete(`${B}/exercises/${id}/`),
    addMuscleToEx:    (exId:number,muscleId:number,intensity:number) => client.post(`${B}/exercises/${exId}/muscles/${muscleId}/`,{intensity}),
    removeMuscleFromEx:(exId:number,muscleId:number) => client.delete(`${B}/exercises/${exId}/muscles/${muscleId}/`),

    getPrograms:      () => client.get<TrainingProgram[]>(`${B}/programs/`),
    getProgram:       (id:number) => client.get<TrainingProgram>(`${B}/programs/${id}/`),
    createProgram:    (d:object) => client.post<TrainingProgram>(`${B}/programs/`,d),
    updateProgram:    (id:number,d:object) => client.patch<TrainingProgram>(`${B}/programs/${id}/`,d),
    deleteProgram:    (id:number) => client.delete(`${B}/programs/${id}/`),
    activateProgram:  (id:number) => client.post(`${B}/programs/${id}/activate/`),

    createDay:        (d:object) => client.post<TrainingDay>(`${B}/days/`,d),
    updateDay:        (id:number,d:object) => client.patch<TrainingDay>(`${B}/days/${id}/`,d),
    deleteDay:        (id:number) => client.delete(`${B}/days/${id}/`),
    addSection:       (dayId:number,title:string) => client.post<DaySection>(`${B}/days/${dayId}/add-section/`,{title}),
    addExercise:      (dayId:number,d:object) => client.post<DayExercise>(`${B}/days/${dayId}/add-exercise/`,d),
    removeExercise:   (dayId:number,deId:number) => client.delete(`${B}/days/${dayId}/remove-exercise/${deId}/`),

    getSessions:      () => client.get<WorkoutSession[]>(`${B}/sessions/`),
    getHistory:       () => client.get<WorkoutSession[]>(`${B}/sessions/history/`),
    createSession:    (dayId:number,date:string) => client.post<WorkoutSession>(`${B}/sessions/`,{day:dayId,date}),
    finishSession:    (id:number) => client.post(`${B}/sessions/${id}/finish/`),
    logSet:           (sessionId:number,d:object) => client.post<SessionSet>(`${B}/sessions/${sessionId}/log-set/`,d),
    lastForExercise:  (exId:number) => client.get<SessionSet[]>(`${B}/sessions/last-for-exercise/`,{params:{exercise_id:exId}}),
};
