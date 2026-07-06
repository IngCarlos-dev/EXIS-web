export type Category = 'Desarrollo web' | 'Inteligencia Artificial' | 'Desarrollo Libre';

export interface Student {
  document_type: string;
  document_id: string;
  name: string;
  semester: string;
  subject1: string;
  subject2?: string;
  email: string;
  phone: string;
}

export interface Project {
  name: string;
  description: string;
  category: Category;
  github_repo?: string;
  objective: string;
  students: Student[];
}
