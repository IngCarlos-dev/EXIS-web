import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Category, Student } from '../types';
import { UserPlus, UserMinus, Send, CheckCircle2, AlertCircle, Sparkles, Github, ExternalLink } from 'lucide-react';

const CATEGORIES: Category[] = ['Desarrollo web', 'Inteligencia Artificial', 'Desarrollo Fullstack'];

const SUBJECTS = [
  'Programación en Red y Multihilos',
  'Computación Gráfica',
  'Desarrollo de software II',
  'Programación Orientada a Objetos I',
  'Programación Orientada a Objetos II',
  'Estructura de Datos',
  'Inteligencia Artificial',
  'Redes Neuronales',
  'Mecatrónica I',
  'Trabajo de Grado',
  'Desarrollo Web',
  'Otro'
];

export default function RegistrationForm() {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Desarrollo web');
  const [githubRepo, setGithubRepo] = useState('');
  const [students, setStudents] = useState<Student[]>([
    { document_id: '', name: '', semester: '', subject1: '', subject2: '', email: '', phone: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const addStudent = () => {
    if (students.length < 3) {
      setStudents([...students, { document_id: '', name: '', semester: '', subject1: '', subject2: '', email: '', phone: '' }]);
    }
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof Student, value: string) => {
    const newStudents = [...students];
    newStudents[index] = { ...newStudents[index], [field]: value };
    setStudents(newStudents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const { error: projectError } = await supabase
        .from('projects')
        .insert([{ 
          name: projectName, 
          description, 
          category,
          github_repo: githubRepo 
        }]);

      if (projectError) {
        if (projectError.code === '23505') throw new Error('El nombre del proyecto ya está registrado.');
        throw projectError;
      }

      const studentsToInsert = students.map(s => ({
        ...s,
        project_name: projectName
      }));

      const { error: studentsError } = await supabase
        .from('students')
        .insert(studentsToInsert);

      if (studentsError) {
        await supabase.from('projects').delete().eq('name', projectName);
        if (studentsError.code === '23505') throw new Error('Uno de los documentos de identidad ya está registrado.');
        throw studentsError;
      }

      setStatus({ type: 'success', message: '¡Proyecto registrado con éxito!' });
      setProjectName('');
      setDescription('');
      setCategory('Desarrollo web');
      setGithubRepo('');
      setStudents([{ document_id: '', name: '', semester: '', subject1: '', subject2: '', email: '', phone: '' }]);
      
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error al registrar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="card-modern overflow-hidden">
        <div className="bg-exis-primary p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">Formulario de Inscripción</h2>
            <p className="mt-2 text-white/70 font-medium">Completa los campos para registrar tu proyecto en EXIS 2026.</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          {/* Project Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-exis-primary/10 flex items-center justify-center text-exis-primary font-black text-sm">1</div>
              <h3 className="text-xl font-black tracking-tight text-slate-800">Información del Proyecto</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Nombre del Proyecto</label>
                <input
                  required
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input-modern"
                  placeholder="Ej: Mi Gran Proyecto"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="input-modern appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Descripción</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-modern h-32 resize-none"
                placeholder="Escribe de qué trata tu proyecto..."
              />
            </div>

            {/* GitHub Section */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 mb-2">
                <Github size={20} />
                <h4 className="font-bold">Repositorio de GitHub</h4>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Enlace del repositorio</label>
                <input
                  type="url"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className="input-modern !bg-white"
                  placeholder="https://github.com/usuario/proyecto"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl space-y-2">
                <p className="text-xs font-bold text-blue-800 flex items-center gap-2">
                  <ExternalLink size={14} /> ¿Cómo subir tu proyecto?
                </p>
                <ul className="text-[11px] text-blue-700 space-y-1 list-disc ml-4">
                  <li>Crea un repositorio en GitHub (público).</li>
                  <li>Sube tus archivos usando Git o directamente en la web de GitHub.</li>
                  <li>Copia el enlace de la barra de direcciones y pégalo aquí.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Students Section */}
          <section className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-exis-primary/10 flex items-center justify-center text-exis-primary font-black text-sm">2</div>
                <h3 className="text-xl font-black tracking-tight text-slate-800">Integrantes</h3>
              </div>
              {students.length < 3 && (
                <button
                  type="button"
                  onClick={addStudent}
                  className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-exis-primary hover:text-exis-secondary transition-colors"
                >
                  <UserPlus size={16} className="transition-transform group-hover:scale-110" /> Agregar integrante
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8">
              {students.map((student, index) => (
                <div key={index} className="group relative p-8 bg-slate-50/50 rounded-3xl border-2 border-transparent hover:border-exis-primary/10 transition-all duration-300">
                  {students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudent(index)}
                      className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <UserMinus size={18} />
                    </button>
                  )}
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="px-3 py-1 bg-white rounded-full text-[10px] font-black uppercase tracking-tighter text-exis-secondary shadow-sm">
                      Integrante #{index + 1}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre completo</label>
                      <input
                        required
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                        className="input-modern !py-2.5 !bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Documento de identidad</label>
                      <input
                        required
                        type="text"
                        value={student.document_id}
                        onChange={(e) => updateStudent(index, 'document_id', e.target.value)}
                        className="input-modern !py-2.5 !bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semestre</label>
                      <input
                        required
                        type="text"
                        value={student.semester}
                        onChange={(e) => updateStudent(index, 'semester', e.target.value)}
                        className="input-modern !py-2.5 !bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo electrónico</label>
                      <input
                        required
                        type="email"
                        value={student.email}
                        onChange={(e) => updateStudent(index, 'email', e.target.value)}
                        className="input-modern !py-2.5 !bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</label>
                      <input
                        required
                        type="tel"
                        value={student.phone}
                        onChange={(e) => updateStudent(index, 'phone', e.target.value)}
                        className="input-modern !py-2.5 !bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignatura 1</label>
                      <select
                        required
                        value={student.subject1}
                        onChange={(e) => updateStudent(index, 'subject1', e.target.value)}
                        className="input-modern !py-2.5 !bg-white appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona una materia</option>
                        {SUBJECTS.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignatura 2 (Opcional)</label>
                      <select
                        value={student.subject2}
                        onChange={(e) => updateStudent(index, 'subject2', e.target.value)}
                        className="input-modern !py-2.5 !bg-white appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona una materia</option>
                        {SUBJECTS.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Extra input for "Otro" if selected */}
                    {(student.subject1 === 'Otro' || student.subject2 === 'Otro') && (
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Especifique la materia</label>
                        <input
                          type="text"
                          placeholder="Escribe el nombre de la materia si seleccionaste 'Otro'"
                          className="input-modern !py-2.5 !bg-white"
                          onChange={(e) => {
                            // This is a bit tricky since we have subject1 and subject2.
                            // If the user selects "Otro" in both, they might need two inputs,
                            // but usually it's just one "Otro" or the same.
                            // To keep it simple as requested, let's just let them type it.
                            // However, subject1 and subject2 are separate fields.
                            // Let's just use the value of the input to update the field that is "Otro".
                            if (student.subject1 === 'Otro') updateStudent(index, 'subject1', e.target.value);
                            else if (student.subject2 === 'Otro') updateStudent(index, 'subject2', e.target.value);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {status && (
            <div className={`p-6 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <p className="font-bold text-sm tracking-tight">{status.message}</p>
            </div>
          )}

          <div className="pt-6">
            <button
              disabled={loading}
              type="submit"
              className="btn-primary w-full py-5 text-lg tracking-tight group"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>Registrar Proyecto</span>
                  <Send size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
