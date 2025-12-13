// ========================================
// Pro Research Agent - Type Definitions
// ========================================

// Core Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  citations?: Citation[];
  paperContext?: Paper;
}

// Paper & Reference Types
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  venue?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  citations?: number;
  keywords?: string[];
  addedAt?: Date;
  folderId?: string;
  tags?: string[];
  notes?: string;
  isRead?: boolean;
}

export interface Citation {
  paperId: string;
  title: string;
  authors: string;
  year: number;
  quote?: string;
  pageNumber?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Search Types
export interface SearchResult {
  papers: Paper[];
  totalCount: number;
  query: string;
  filters: SearchFilters;
  aiSummary?: string;
}

export interface SearchFilters {
  yearStart?: number;
  yearEnd?: number;
  sources?: string[];
  sortBy?: 'relevance' | 'citations' | 'year';
  sortOrder?: 'asc' | 'desc';
}

// Literature Review Types
export interface LitReviewTable {
  id: string;
  name: string;
  papers: Paper[];
  columns: ExtractionColumn[];
  rows: ExtractionRow[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractionColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'list' | 'boolean';
  description?: string;
}

export interface ExtractionRow {
  paperId: string;
  values: Record<string, string | number | boolean | string[]>;
}

// AI Writer Types
export interface WriterDocument {
  id: string;
  title: string;
  content: string;
  sections: DocumentSection[];
  citations: Citation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  type: 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion' | 'custom';
}

// PDF Viewer Types
export interface Annotation {
  id: string;
  paperId: string;
  type: 'highlight' | 'note' | 'underline';
  content: string;
  selectedText?: string;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  color?: string;
  createdAt: Date;
}

// Architecture/UI Types
export interface ArchitectureNode {
  id: string;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

// Navigation Types
export type ViewState =
  | 'search'
  | 'deep-research'
  | 'library'
  | 'reader'
  | 'review'
  | 'writer'
  | 'chat'
  | 'architecture'
  | 'settings'
  | 'profile';

export interface NavItem {
  id: ViewState;
  label: string;
  icon: string;
  badge?: number;
}

// Deep Research Types
export interface DeepResearchReport {
  id: string;
  topic: string;
  papers: Paper[];
  themes: ResearchTheme[];
  consensus: string[];
  disagreements: string[];
  gaps: string[];
  recommendations: string[];
  generatedAt: Date;
}

export interface ResearchTheme {
  name: string;
  description: string;
  papers: string[]; // paper IDs
  keyFindings: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// App State
export interface AppState {
  currentView: ViewState;
  sidebarOpen: boolean;
  selectedPaper: Paper | null;
  library: Paper[];
  folders: Folder[];
  tags: Tag[];
  searchResults: SearchResult | null;
  isLoading: boolean;
}
