export type BulkResultItem = {
  serial: string;
  found: boolean;
  updated: boolean;
  message?: string;
  warning?: string;
  usuarioExcel?: string | null;
  usuarioActual?: string | null;
  usuarioExiste?: boolean;
};

export type BulkUpdateResult = {
  summary: {
    totalRows: number;
    totalSerialesUnicos: number;
    found: number;
    updated: number;
    created?: number;
    notFound: number;
    serialesFaltantes: string[];
    usuariosNoEncontrados: number;
    incongruenciasUsuarios: number;
    marcasCreadas?: number;
    modelosCreados?: number;
  };
  results: BulkResultItem[];
};
