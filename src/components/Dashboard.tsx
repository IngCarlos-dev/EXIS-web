import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Project, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LayoutDashboard, Users, Briefcase, ChevronRight, X, Phone, Mail, GraduationCap, IdCard, Search, ArrowRight, TrendingUp } from 'lucide-react';

const COLORS = ['#00594E', '#B5A160', '#36BCEE', '#6366F1', '#EC4899', '#F59E0B'];

interface ProjectWithStudents extends Project {
  students: Student[];
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStudents | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*, students(*)');

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setProjects(data as ProjectWithStudents[]);
    }
    setLoading(false);
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    
    const categoryMap: Record<string, number> = {};
    projects.forEach(p => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    const subjectMap: Record<string, number> = {};
    projects.forEach(p => {
      p.students.forEach(s => {
        if (s.subject1) subjectMap[s.subject1] = (subjectMap[s.subject1] || 0) + 1;
        if (s.subject2) subjectMap[s.subject2] = (subjectMap[s.subject2] || 0) + 1;
      });
    });
    const subjectData = Object.entries(subjectMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { totalProjects, categoryData, subjectData };
  }, [projects]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-exis-primary rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cargando Ecosistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Proyectos', value: stats.totalProjects, icon: LayoutDashboard, color: 'text-exis-primary', bg: 'bg-exis-primary/5' },
          { label: 'Participantes', value: projects.reduce((acc, p) => acc + p.students.length, 0), icon: Users, color: 'text-exis-secondary', bg: 'bg-exis-secondary/5' },
          { label: 'Categorías', value: stats.categoryData.length, icon: Briefcase, color: 'text-exis-accent', bg: 'bg-exis-accent/5' }
        ].map((item, i) => (
          <div key={i} className="card-modern p-8 flex items-center gap-6 group">
            <div className={`p-4 ${item.bg} ${item.color} rounded-2xl transition-transform group-hover:scale-110 duration-300`}>
              <item.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-modern p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight text-slate-800">Distribución de Categorías</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><TrendingUp size={16} className="text-slate-400" /></div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-modern p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight text-slate-800">Top Asignaturas</h3>
            <div className="p-2 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 px-3 uppercase tracking-widest">Participación</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subjectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} width={100} tick={{ fontWeight: 700, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#B5A160" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="card-modern overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-xl font-black tracking-tight text-slate-800">Proyectos inscritos</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar proyecto o categoría..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-exis-primary/5 border-2 border-transparent focus:border-exis-primary/20 outline-none transition-all"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white col-span-full">
              <p className="text-sm font-black uppercase tracking-widest">No se encontraron coincidencias</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <button
                key={project.name}
                onClick={() => setSelectedProject(project)}
                className="group bg-white p-8 text-left hover:bg-slate-50/50 transition-all duration-300"
              >
                <div className="mb-4 inline-block px-3 py-1 bg-exis-primary/5 text-exis-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                  {project.category}
                </div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight mb-2 group-hover:text-exis-primary transition-colors line-clamp-1">{project.name}</h4>
                <p className="text-sm text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">{project.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex -space-x-2">
                    {project.students.map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-exis-primary group-hover:text-white transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col scale-in duration-300">
            <div className="p-10 bg-exis-primary text-white relative">
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
              <div className="inline-block px-4 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                Información detallada
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedProject.name}</h2>
              <p className="text-exis-secondary font-black uppercase tracking-[0.2em] text-xs">{selectedProject.category}</p>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-12">
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Descripción del Proyecto</h3>
                  <p className="text-slate-600 leading-relaxed font-medium text-lg italic border-l-4 border-exis-secondary pl-6">"{selectedProject.description}"</p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 border-2 border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-800 shadow-sm">
                    <Code2 size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Repositorio de Código</p>
                    {selectedProject.github_repo ? (
                      <a 
                        href={selectedProject.github_repo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-exis-primary font-bold text-sm hover:text-exis-secondary transition-colors flex items-center gap-2"
                      >
                        Ver en GitHub <ExternalLink size={14} />
                      </a>
                    ) : (
                      <p className="text-slate-400 text-xs font-bold italic">No registrado</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Categoría</h3>
                  <p className="text-slate-800 font-black text-xl">{selectedProject.category}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Estado</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                    Inscrito
                  </span>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Integrantes</h3>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedProject.students.map((student) => (
                    <div key={student.document_id} className="bg-white p-6 rounded-3xl border-2 border-slate-50 hover:border-exis-primary/10 transition-all group">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-exis-primary group-hover:bg-exis-primary group-hover:text-white transition-all">
                          <Users size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 tracking-tight">{student.name}</h4>
                          <p className="text-[10px] font-black text-exis-secondary uppercase tracking-widest">{student.semester}º Semestre</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                          <IdCard size={14} className="text-slate-300" />
                          <span>{student.document_id}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                          <Mail size={14} className="text-slate-300" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                          <Phone size={14} className="text-slate-300" />
                          <span>{student.phone}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600 truncate">
                          {student.subject1}
                        </div>
                        {student.subject2 && (
                          <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600 truncate">
                            {student.subject2}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-8 py-3 bg-white hover:bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-slate-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
