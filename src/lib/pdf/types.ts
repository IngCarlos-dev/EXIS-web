export type Category = 'Desarrollo web' | 'Inteligencia Artificial' | 'Desarrollo Fullstack' | 'Desarrollo Libre';

export interface Student {
  document_id: string;
  name: string;
  semester: string;
  subject1: string;
  teacher1?: string;
  subject2?: string;
  teacher2?: string;
  email: string;
  phone: string;
  subject1_custom?: string;
  subject2_custom?: string;
}

export interface Project {
  name: string;
  description: string;
  category: Category;
  github_repo?: string;
  students: Student[];
}
