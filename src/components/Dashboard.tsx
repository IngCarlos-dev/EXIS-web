import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Project, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  LayoutDashboard, Users, Briefcase, ChevronRight, X, Phone, Mail, GraduationCap, 
  IdCard, Search, ArrowRight, TrendingUp, Code2, ExternalLink, Lock, 
  CheckCircle2, AlertTriangle, LogOut, Edit, Trash2, Save 
} from 'lucide-react';

const COLORS = ['#00594E', '#B5A160', '#36BCEE', '#6366F1', '#EC4899', '#F59E0B'];

const CATEGORIES = ['Desarrollo web', 'Inteligencia Artificial', 'Desarrollo Libre'] as const;

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

const TEACHERS = [
  'Luis Miguel Piamonte Pardo',
  'Cesar Dayan Martelo',
  'Claudia Patricia Ochica Plazas',
  'Jorge Enrique Chaparro',
  'Fabián Alberto Ayala Lozano',
  'Cristian Leandro Camargo Pinilla',
  'Juan Carlos Fonseca',
  'Julián Alberto Ramírez',
  'Esteban Amezquita',
  'Karen Lizeth Giraldo',
  'Javier Aquilino Salcedo',
  'Michael Arley Chaparro',
  'Hernan Alberto Forero',
  'Yesid Manuel Piamonte'
];

interface ProjectWithStudents extends Project {
  students: Student[];
  verification_code?: string;
}

export default function Dashboard() {
  // Authentication & Verification States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Public Verification Search
  const [verifyHash, setVerifyHash] = useState('');
  const [verifiedProject, setVerifiedProject] = useState<ProjectWithStudents | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Admin Dashboard Data
  const [projects, setProjects] = useState<ProjectWithStudents[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStudents | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Registration Status
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleRegistration = async () => {
    const newValue = !isRegistrationClosed;
    
    // Primero intentamos actualizar
    const { data, error: updateError } = await supabase
      .from('settings')
      .update({ value: newValue })
      .eq('key', 'is_registration_closed')
      .select();
      
    if (updateError) {
      showToast(`Error: ${updateError.message}`, 'error');
      console.error(updateError);
      return;
    }

    // Si data.length es 0, significa que la fila no existe. Debemos insertarla.
    if (data && data.length === 0) {
      const { error: insertError } = await supabase
        .from('settings')
        .insert({ key: 'is_registration_closed', value: newValue });
        
      if (insertError) {
        showToast(`Error (Insert): ${insertError.message}`, 'error');
        console.error(insertError);
        return;
      }
    }

    setIsRegistrationClosed(newValue);
    showToast(`Inscripciones ${newValue ? 'CERRADAS' : 'ABIERTAS'} exitosamente.`, 'success');
  };

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editCategory, setEditCategory] = useState<'Desarrollo web' | 'Inteligencia Artificial' | 'Desarrollo Libre'>('Desarrollo web');
  const [editGithubRepo, setEditGithubRepo] = useState('');
  const [editStudents, setEditStudents] = useState<Student[]>([]);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch projects
    const { data, error } = await supabase
      .from('projects')
      .select('*, students(*)');

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setProjects(data as ProjectWithStudents[]);
    }

    // Fetch registration status
    try {
      const { data: statusData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'is_registration_closed')
        .single();
      
      if (statusData) {
        setIsRegistrationClosed(statusData.value === true || statusData.value === 'true');
      }
    } catch (e) {
      console.error('Error fetching registration status (table might not exist yet)', e);
    }

    setLoading(false);
  }

  // Handle Admin Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const expectedUser = import.meta.env.PUBLIC_ADMIN_USERNAME || 'admin';
    const expectedPass = import.meta.env.PUBLIC_ADMIN_PASSWORD || 'exis2026a_admin_secure';

    if (username.trim() === expectedUser && password === expectedPass) {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setProjects([]);
  };

  // Public Verification Search
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyHash.trim()) return;

    setVerifying(true);
    setVerifyError('');
    setVerifiedProject(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, students(*)')
        .eq('verification_code', verifyHash.trim());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setVerifyError('Firma de control (HASH) no registrada o inválida.');
      } else {
        setVerifiedProject(data[0] as ProjectWithStudents);
      }
    } catch (err: any) {
      setVerifyError('Error al realizar la verificación.');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  // Start Edit Mode
  const startEditing = () => {
    if (!selectedProject) return;
    setEditName(selectedProject.name);
    setEditDescription(selectedProject.description);
    setEditObjective(selectedProject.objective);
    setEditCategory(selectedProject.category as any);
    setEditGithubRepo(selectedProject.github_repo || '');
    setEditStudents(JSON.parse(JSON.stringify(selectedProject.students))); // Deep copy
    setIsEditing(true);
  };

  // Save Changes
  const saveChanges = async () => {
    if (!selectedProject) return;

    try {
      // 1. If project name changed, update relation in students table first
      if (editName.trim() !== selectedProject.name) {
        const { error: studUpdateErr } = await supabase
          .from('students')
          .update({ project_name: editName.trim() })
          .eq('project_name', selectedProject.name);
        if (studUpdateErr) throw studUpdateErr;
      }

      // 2. Update project
      const { error: projErr } = await supabase
        .from('projects')
        .update({
          name: editName.trim(),
          description: editDescription.trim(),
          objective: editObjective.trim(),
          category: editCategory,
          github_repo: editGithubRepo.trim() || null
        })
        .eq('name', selectedProject.name);

      if (projErr) throw projErr;

      // 3. Update each student record
      for (const stud of editStudents) {
        const { error: studErr } = await supabase
          .from('students')
          .update({
            name: stud.name,
            document_type: stud.document_type,
            semester: stud.semester,
            email: stud.email,
            phone: stud.phone,
            subject1: stud.subject1,
            teacher1: stud.teacher1,
            subject2: stud.subject2 || null,
            teacher2: stud.teacher2 || null
          })
          .eq('document_id', stud.document_id);
        if (studErr) throw studErr;
      }

      setIsEditing(false);
      await fetchData();

      // Refresh modal values
      const updatedProj = projects.find(p => p.verification_code === selectedProject.verification_code);
      if (updatedProj) {
        setSelectedProject(updatedProj);
      } else {
        setSelectedProject(null);
      }
      showToast('¡Proyecto actualizado con éxito!', 'success');
    } catch (err: any) {
      showToast('Error al actualizar el proyecto: ' + err.message, 'error');
    }
  };

  // Delete Project
  const deleteProject = async () => {
    if (!selectedProject) return;

    if (!confirm(`¿Está seguro de que desea eliminar permanentemente el proyecto "${selectedProject.name}" y todos sus integrantes?`)) {
      return;
    }

    try {
      // Delete students first
      const { error: studErr } = await supabase
        .from('students')
        .delete()
        .eq('project_name', selectedProject.name);
      if (studErr) throw studErr;

      // Delete project
      const { error: projErr } = await supabase
        .from('projects')
        .delete()
        .eq('name', selectedProject.name);
      if (projErr) throw projErr;

      setSelectedProject(null);
      await fetchData();
      showToast('Proyecto eliminado con éxito.', 'success');
    } catch (err: any) {
      showToast('Error al eliminar el proyecto: ' + err.message, 'error');
    }
  };

  // Filtered list for admin
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute stats for admin
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

    const teacherMap: Record<string, number> = {};
    projects.forEach(p => {
      const teachersInProject = new Set<string>();
      p.students.forEach(s => {
        if (s.teacher1 && s.teacher1.trim()) teachersInProject.add(s.teacher1.trim());
        if (s.teacher2 && s.teacher2.trim()) teachersInProject.add(s.teacher2.trim());
      });
      teachersInProject.forEach(teacher => {
        teacherMap[teacher] = (teacherMap[teacher] || 0) + 1;
      });
    });
    const teacherData = Object.entries(teacherMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { totalProjects, categoryData, subjectData, teacherData };
  }, [projects]);

  // PUBLIC/LOGIN INTERFACE (Unauthenticated)
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Admin Login Form */}
          <div className="lg:col-span-5 card-modern p-10 flex flex-col justify-between border border-slate-200/60 bg-white">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-exis-primary">
                <div className="p-3 bg-exis-primary/10 rounded-2xl">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-800">Acceso Administrativo</h3>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Gestión de Proyectos EXIS 2026-A</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Usuario</label>
                  <input
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-modern"
                    placeholder="Ej: admin"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Contraseña</label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-modern"
                    placeholder="••••••••••••"
                  />
                </div>

                {loginError && (
                  <p className="text-xs font-bold text-rose-600 ml-1 flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle size={14} /> {loginError}
                  </p>
                )}

                <button type="submit" className="btn-primary w-full py-4 text-sm mt-2">
                  Iniciar Sesión
                </button>
              </form>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Exclusivo para la dirección del programa y jurados
              </p>
            </div>
          </div>

          {/* Public Verification Box */}
          <div className="lg:col-span-7 card-modern p-10 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-exis-primary/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-exis-secondary">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Verificador de Inscripción</h3>
                  <p className="text-[10px] uppercase tracking-widest text-exis-secondary font-bold">Verificación Pública de Comprobantes</p>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                Introduce la firma de control o código hash impreso en tu comprobante en PDF para validar si el proyecto se encuentra legítimamente inscrito en el sistema de **EXIS 2026-A**.
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={verifyHash}
                    onChange={(e) => setVerifyHash(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold tracking-tight text-white placeholder-slate-500 focus:bg-white/10 focus:border-exis-secondary outline-none transition-all"
                    placeholder="SEC-EXIS-2026-A-XXXXXXXX-XXXXXXXX"
                  />
                  <button 
                    type="submit" 
                    disabled={verifying}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-exis-secondary hover:bg-exis-secondary/90 text-slate-900 font-bold text-xs rounded-xl transition-all"
                  >
                    {verifying ? 'Validando...' : 'Verificar'}
                  </button>
                </div>

                {verifyError && (
                  <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={16} /> {verifyError}
                  </div>
                )}
              </form>

              {/* Verified Result Card */}
              {verifiedProject && (
                <div className="p-6 bg-emerald-950/40 border border-emerald-800 rounded-3xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={20} />
                    <span className="text-xs font-black uppercase tracking-wider">Comprobante Legítimo</span>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg leading-tight mb-1">{verifiedProject.name}</h4>
                    <p className="text-[10px] text-exis-secondary uppercase tracking-widest font-black">{verifiedProject.category}</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-900/60">
                    <p className="text-[10px] uppercase font-bold text-emerald-500/80 mb-2">Integrantes Oficiales</p>
                    <ul className="space-y-1 text-slate-200 text-xs font-bold list-disc list-inside">
                      {verifiedProject.students.map((student, i) => (
                        <li key={i}>{student.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Seguridad criptográfica garantizada • EXIS 2026-A
            </div>
          </div>

        </div>
      </div>
    );
  }

  // LOADING STATE (Authenticated admin waiting for fetch)
  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-exis-primary rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cargando Ecosistema EXIS 2026-A...</p>
      </div>
    );
  }

  // ADMIN DASHBOARD VIEW
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Admin Logged-In Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl gap-4">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold">Sesión Administrativa Activa</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Toggle Button */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-emerald-100 shadow-sm">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Inscripciones:</span>
            <button 
              onClick={toggleRegistration}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${!isRegistrationClosed ? 'bg-emerald-500' : 'bg-rose-500'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!isRegistrationClosed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-[10px] font-black uppercase tracking-widest ${!isRegistrationClosed ? 'text-emerald-600' : 'text-rose-600'}`}>
              {!isRegistrationClosed ? 'Abiertas' : 'Cerradas'}
            </span>
          </div>

          {/* Logout Button */}
          <div className="hidden sm:block w-px h-8 bg-emerald-200 mx-1"></div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-black uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="card-modern p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight text-slate-800">Proyectos por Profesor</h3>
            <div className="p-2 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 px-3 uppercase tracking-widest">Docentes</div>
          </div>
          <div className="h-72">
            {stats.teacherData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
                Sin profesores registrados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.teacherData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={10} 
                    width={110} 
                    tick={{ fontWeight: 700, fill: '#64748B' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val: string) => val.length > 16 ? `${val.slice(0, 14)}...` : val}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} proyecto(s)`, 'Proyectos']}
                  />
                  <Bar dataKey="value" fill="#00594E" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
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
                onClick={() => {
                  setSelectedProject(project);
                  setIsEditing(false);
                }}
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

      {/* DETAIL & EDIT MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col scale-in duration-300 my-auto">
            
            {/* Modal Header */}
            <div className="p-10 bg-exis-primary text-white relative flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setIsEditing(false);
                }}
                className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
              <div className="inline-block px-4 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                {isEditing ? 'Modo de Edición' : 'Información detallada'}
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-300">Nombre del Proyecto</label>
                    <input
                      required
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xl font-bold tracking-tight text-white focus:bg-white/15 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-300">Categoría</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="bg-exis-primary border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white focus:bg-white/10 outline-none cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedProject.name}</h2>
                  <p className="text-exis-secondary font-black uppercase tracking-[0.2em] text-xs">{selectedProject.category}</p>
                </>
              )}
            </div>
            
            {/* Modal Body */}
            <div className="p-10 overflow-y-auto flex-grow space-y-12">
              {isEditing ? (
                // EDIT MODE BODY
                <div className="space-y-8">
                  {/* General Project Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Datos Generales</h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Descripción</label>
                      <textarea
                        required
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="input-modern h-24 resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Objetivo del Proyecto</label>
                      <textarea
                        required
                        value={editObjective}
                        onChange={(e) => setEditObjective(e.target.value)}
                        className="input-modern h-20 resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Repositorio GitHub</label>
                      <input
                        type="url"
                        value={editGithubRepo}
                        onChange={(e) => setEditGithubRepo(e.target.value)}
                        className="input-modern"
                      />
                    </div>
                  </div>

                  {/* Students Info */}
                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Datos de Integrantes</h4>
                    
                    <div className="space-y-8">
                      {editStudents.map((stud, idx) => (
                        <div key={stud.document_id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-exis-secondary">Integrante #{idx + 1} - {stud.name}</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Nombre Completo</label>
                              <input
                                required
                                type="text"
                                value={stud.name}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].name = e.target.value;
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Tipo de Documento</label>
                              <select
                                required
                                value={stud.document_type || 'CC'}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].document_type = e.target.value;
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white cursor-pointer"
                              >
                                <option value="CC">Cédula de Ciudadanía (CC)</option>
                                <option value="CE">Cédula de Extranjería (CE)</option>
                                <option value="TI">Tarjeta de Identidad (TI)</option>
                                <option value="PAS">Pasaporte (PAS)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Número de Documento</label>
                              <input
                                required
                                type="text"
                                value={stud.document_id}
                                disabled
                                className="input-modern !py-2 bg-slate-100 cursor-not-allowed opacity-80"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Semestre</label>
                              <input
                                required
                                type="text"
                                value={stud.semester}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].semester = e.target.value;
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Correo</label>
                              <input
                                required
                                type="email"
                                value={stud.email}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].email = e.target.value;
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Teléfono</label>
                              <input
                                required
                                type="text"
                                value={stud.phone}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].phone = e.target.value;
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white"
                              />
                            </div>

                            {/* Subjects & Teachers selection */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Asignatura 1</label>
                              <select
                                required
                                value={stud.subject1}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].subject1 = e.target.value;
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white cursor-pointer"
                              >
                                {SUBJECTS.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Profesor Asignatura 1</label>
                              <select
                                required
                                value={stud.teacher1 || ''}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].teacher1 = e.target.value;
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white cursor-pointer"
                              >
                                <option value="">Selecciona profesor</option>
                                {TEACHERS.map(prof => (
                                  <option key={prof} value={prof}>{prof}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Asignatura 2 (Opcional)</label>
                              <select
                                value={stud.subject2 || ''}
                                onChange={(e) => {
                                  const temp = [...editStudents];
                                  temp[idx].subject2 = e.target.value;
                                  if (!e.target.value) {
                                    temp[idx].teacher2 = '';
                                  }
                                  setEditStudents(temp);
                                }}
                                className="input-modern !py-2 !bg-white cursor-pointer"
                              >
                                <option value="">Ninguna</option>
                                {SUBJECTS.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                            {stud.subject2 && (
                              <div className="space-y-1 md:col-span-2 lg:col-span-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Profesor Asignatura 2</label>
                                <select
                                  required={!!stud.subject2}
                                  value={stud.teacher2 || ''}
                                  onChange={(e) => {
                                    const temp = [...editStudents];
                                    temp[idx].teacher2 = e.target.value;
                                    setEditStudents(temp);
                                  }}
                                  className="input-modern !py-2 !bg-white cursor-pointer"
                                >
                                  <option value="">Selecciona profesor</option>
                                  {TEACHERS.map(prof => (
                                    <option key={prof} value={prof}>{prof}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // VIEW MODE BODY
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Descripción del Proyecto</h3>
                        <p className="text-slate-600 leading-relaxed font-medium text-lg italic border-l-4 border-exis-secondary pl-6">"{selectedProject.description}"</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Objetivo del Proyecto</h3>
                        <p className="text-slate-600 leading-relaxed font-medium text-base border-l-4 border-exis-primary pl-6">{selectedProject.objective}</p>
                      </div>
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

                  {/* Hidden / Private Verification HASH */}
                  <section className="p-6 bg-slate-900 text-white rounded-3xl space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-exis-secondary">Código Oculto de Verificación (Firma HASH)</h3>
                    <p className="font-mono text-xs font-black select-all tracking-wider text-slate-100 bg-white/5 p-4 rounded-xl border border-white/10">
                      {selectedProject.verification_code || 'No Generado'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold italic">Este hash coincide con el impreso en el PDF del estudiante y garantiza la legitimidad de su registro.</p>
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
                              <span>{student.document_type || 'CC'} - {student.document_id}</span>
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
                            <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600">
                              <div className="truncate">{student.subject1}</div>
                              {student.teacher1 && (
                                <div className="text-[9px] text-slate-400 font-normal mt-0.5 truncate">
                                  Prof: {student.teacher1}
                                </div>
                              )}
                            </div>
                            {student.subject2 && (
                              <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600">
                                <div className="truncate">{student.subject2}</div>
                                {student.teacher2 && (
                                  <div className="text-[9px] text-slate-400 font-normal mt-0.5 truncate">
                                    Prof: {student.teacher2}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
            
            {/* Modal Footer (with controls) */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
              <div>
                {!isEditing && (
                  <button
                    onClick={deleteProject}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                  >
                    <Trash2 size={14} /> Eliminar Proyecto
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-8 py-3 bg-white hover:bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveChanges}
                      className="flex items-center gap-1.5 px-8 py-3 bg-exis-primary hover:bg-exis-primary/95 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                    >
                      <Save size={14} /> Guardar Cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 px-8 py-3 bg-exis-secondary hover:bg-exis-secondary/90 text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                    >
                      <Edit size={14} /> Editar Proyecto
                    </button>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="px-8 py-3 bg-white hover:bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-slate-200 transition-all"
                    >
                      Cerrar
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-emerald-900 text-emerald-50' : 'bg-rose-900 text-rose-50'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertTriangle size={20} className="text-rose-400" />}
          <span className="font-bold text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-4 opacity-70 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
