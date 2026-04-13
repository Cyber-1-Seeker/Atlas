import {create} from 'zustand/react';
import {fitnessApi, type Exercise, type TrainingProgram, type WorkoutSession, type MuscleGroup, type SessionSet, type TrainingDay} from '../../api/fitness.ts';

interface FitnessState {
    exercises:    Exercise[];
    muscles:      MuscleGroup[];
    programs:     TrainingProgram[];
    activeSession:WorkoutSession|null;
    sessionSets:  SessionSet[];
    lastSets:     Record<number, SessionSet[]>;
    isLoading:    boolean;

    fetchMuscles:   (params?:Record<string,string>) => Promise<void>;
    fetchExercises: (params?:Record<string,string>) => Promise<void>;
    fetchPrograms:  () => Promise<void>;
    fetchProgram:   (id:number) => Promise<TrainingProgram>;

    createProgram:  (name:string, weeks:number) => Promise<TrainingProgram>;
    deleteProgram:  (id:number) => Promise<void>;
    activateProgram:(id:number) => Promise<void>;

    startSession:   (dayId:number) => Promise<WorkoutSession>;
    finishSession:  () => Promise<void>;
    logSet:         (dayExerciseId:number, setNum:number, weight:number, reps:number) => Promise<SessionSet>;
    fetchLastSets:  (exerciseId:number) => Promise<void>;
    setActiveSession:(s:WorkoutSession|null)=>void;
}

export const useFitnessStore = create<FitnessState>((set, get) => ({
    exercises:    [],
    muscles:      [],
    programs:     [],
    activeSession:null,
    sessionSets:  [],
    lastSets:     {},
    isLoading:    false,

    fetchMuscles: async(params)=>{
        const {data} = await fitnessApi.getMuscles(params);
        set({muscles:data});
    },

    fetchExercises: async(params)=>{
        set({isLoading:true});
        try{ const {data}=await fitnessApi.getExercises(params); set({exercises:data}); }
        finally{ set({isLoading:false}); }
    },

    fetchPrograms: async()=>{
        set({isLoading:true});
        try{ const {data}=await fitnessApi.getPrograms(); set({programs:data}); }
        finally{ set({isLoading:false}); }
    },

    fetchProgram: async(id)=>{
        const {data}=await fitnessApi.getProgram(id);
        set(s=>({programs:s.programs.map(p=>p.id===id?data:p)}));
        return data;
    },

    createProgram: async(name,weeks)=>{
        const {data}=await fitnessApi.createProgram({name,weeks_count:weeks});
        set(s=>({programs:[data,...s.programs]}));
        return data;
    },

    deleteProgram: async(id)=>{
        await fitnessApi.deleteProgram(id);
        set(s=>({programs:s.programs.filter(p=>p.id!==id)}));
    },

    activateProgram: async(id)=>{
        await fitnessApi.activateProgram(id);
        set(s=>({programs:s.programs.map(p=>({...p,is_active:p.id===id}))}));
    },

    startSession: async(dayId)=>{
        const date=new Date().toISOString().slice(0,10);
        const {data}=await fitnessApi.createSession(dayId,date);
        set({activeSession:data,sessionSets:[]});
        return data;
    },

    finishSession: async()=>{
        const {activeSession}=get();
        if(!activeSession) return;
        await fitnessApi.finishSession(activeSession.id);
        set({activeSession:null,sessionSets:[]});
        get().fetchPrograms();
    },

    logSet: async(dayExerciseId,setNum,weight,reps)=>{
        const {activeSession}=get();
        if(!activeSession) throw new Error('No active session');
        const {data}=await fitnessApi.logSet(activeSession.id,{
            day_exercise_id:dayExerciseId,set_number:setNum,weight,reps,
        });
        set(s=>({sessionSets:[...s.sessionSets.filter(x=>!(x.day_exercise===dayExerciseId&&x.set_number===setNum)),data]}));
        return data;
    },

    fetchLastSets: async(exerciseId)=>{
        const {data}=await fitnessApi.lastForExercise(exerciseId);
        set(s=>({lastSets:{...s.lastSets,[exerciseId]:data}}));
    },

    setActiveSession:(s)=>set({activeSession:s,sessionSets:[]}),
}));
