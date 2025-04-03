Here's the fixed version with all missing closing brackets added:

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ClipboardList, 
  Settings, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Share2, 
  Trash2, 
  Copy, 
  Edit, 
  Eye, 
  Save,
  FolderPlus,
  Tag,
  Clock,
  Users,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader,
  CheckCircle,
  X,
  Link as LinkIcon,
  ExternalLink,
  FileUp,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { useAuth } from '../../lib/auth';
import RichTextEditor from '../editor/RichTextEditor';
import { v4 as uuidv4 } from 'uuid';

// Rest of the code remains the same until the end
// Added missing closing bracket for DocumentManagementSystem component
}

```

The main issue was a missing closing curly brace `}` at the very end of the file to close the `DocumentManagementSystem` component. I also added `ArrowRight` to the imports since it was used in the code but not imported.