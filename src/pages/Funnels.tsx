import React, { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Megaphone, 
  LayoutTemplate, 
  ShoppingCart, 
  CheckCircle, 
  Search, 
  MessageCircle, 
  Video, 
  PlaySquare, 
  Tag, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Settings
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Custom Node Component
const FunnelNode = ({ data, selected }: any) => {
  const Icon = data.icon;
  return (
    <div className={cn(
      "bg-card border-2 rounded-xl p-4 w-64 shadow-lg transition-all",
      selected ? "border-primary shadow-primary/20" : "border-border",
      data.colorClass
    )}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-secondary border-2 border-border" />
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", data.bgClass)}>
          {Icon && <Icon size={20} className={data.iconClass} />}
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-white text-sm">{data.label}</h3>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{data.description}</p>
          {data.metrics && (
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <span className="text-xs text-text-secondary">{data.metrics.label}</span>
              <span className="text-sm font-bold text-white">{data.metrics.value}</span>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary border-2 border-background" />
    </div>
  );
};

const nodeTypes = {
  funnelNode: FunnelNode,
};

const defaultNodes: Node[] = [
  {
    id: '1',
    type: 'funnelNode',
    position: { x: 100, y: 200 },
    data: { 
      label: 'Tráfego Pago', 
      description: 'Campanhas Meta e Google Ads',
      icon: Megaphone,
      colorClass: 'border-l-blue-500',
      bgClass: 'bg-blue-500/10',
      iconClass: 'text-blue-500',
      metrics: { label: 'Cliques', value: '12.4k' }
    },
  },
  {
    id: '2',
    type: 'funnelNode',
    position: { x: 450, y: 200 },
    data: { 
      label: 'Página de Vendas', 
      description: 'Landing page principal do produto',
      icon: LayoutTemplate,
      colorClass: 'border-l-primary',
      bgClass: 'bg-primary/10',
      iconClass: 'text-primary',
      metrics: { label: 'Conversão', value: '4.2%' }
    },
  },
  {
    id: '3',
    type: 'funnelNode',
    position: { x: 800, y: 200 },
    data: { 
      label: 'Checkout', 
      description: 'Página de pagamento',
      icon: ShoppingCart,
      colorClass: 'border-l-emerald-500',
      bgClass: 'bg-emerald-500/10',
      iconClass: 'text-emerald-500',
      metrics: { label: 'Vendas', value: '520' }
    },
  },
];

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } },
];

const blocks = [
  { id: 'traffic', label: 'Tráfego', icon: Megaphone, color: 'blue' },
  { id: 'sales_page', label: 'Página de Vendas', icon: LayoutTemplate, color: 'primary' },
  { id: 'checkout', label: 'Checkout', icon: ShoppingCart, color: 'emerald' },
  { id: 'thank_you', label: 'Página de Obrigado', icon: CheckCircle, color: 'emerald' },
  { id: 'survey', label: 'Pesquisa', icon: Search, color: 'yellow' },
  { id: 'whatsapp', label: 'Grupo WhatsApp', icon: MessageCircle, color: 'green' },
  { id: 'class', label: 'Aula', icon: Video, color: 'primary' },
  { id: 'replay', label: 'Replay', icon: PlaySquare, color: 'orange' },
  { id: 'offer', label: 'Oferta', icon: Tag, color: 'red' },
  { id: 'community', label: 'Comunidade', icon: Users, color: 'primary' },
  { id: 'upsell', label: 'Upsell', icon: ArrowUpCircle, color: 'emerald' },
  { id: 'downsell', label: 'Downsell', icon: ArrowDownCircle, color: 'red' },
];

interface FunnelsProps {
  hideHeader?: boolean;
  readOnly?: boolean;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onChange?: (nodes: Node[], edges: Edge[]) => void;
}

export function FunnelsContent({ hideHeader = false, readOnly = false, initialNodes = defaultNodes, initialEdges = defaultEdges, onChange }: FunnelsProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (readOnly) return;
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);
        onChange?.(newNodes, edges);
        return newNodes;
      });
    },
    [readOnly, onChange, edges]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return;
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        onChange?.(nodes, newEdges);
        return newEdges;
      });
    },
    [readOnly, onChange, nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) => {
        const newEdges = addEdge({ ...params, animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } } as any, eds);
        onChange?.(nodes, newEdges);
        return newEdges;
      });
    },
    [readOnly, onChange, nodes]
  );

  const onNodeClick = (_: any, node: Node) => {
    if (readOnly) return;
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const onDragStart = (event: React.DragEvent, block: any) => {
    if (readOnly) return;
    event.dataTransfer.setData('application/reactflow', block.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (readOnly) return;
      event.preventDefault();

      const blockId = event.dataTransfer.getData('application/reactflow');

      if (!blockId) return;

      const block = blocks.find(b => b.id === blockId);
      if (!block) return;
      
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const colorMap: Record<string, any> = {
        blue: { colorClass: 'border-l-blue-500', bgClass: 'bg-blue-500/10', iconClass: 'text-blue-500' },
        primary: { colorClass: 'border-l-primary', bgClass: 'bg-primary/10', iconClass: 'text-primary' },
        emerald: { colorClass: 'border-l-emerald-500', bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-500' },
        yellow: { colorClass: 'border-l-yellow-500', bgClass: 'bg-yellow-500/10', iconClass: 'text-yellow-500' },
        green: { colorClass: 'border-l-green-500', bgClass: 'bg-green-500/10', iconClass: 'text-green-500' },
        orange: { colorClass: 'border-l-orange-500', bgClass: 'bg-orange-500/10', iconClass: 'text-orange-500' },
        red: { colorClass: 'border-l-red-500', bgClass: 'bg-red-500/10', iconClass: 'text-red-500' },
      };

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'funnelNode',
        position,
        data: { 
          label: block.label, 
          description: 'Nova etapa do funil',
          icon: block.icon,
          ...colorMap[block.color]
        },
      };

      setNodes((nds) => {
        const newNodes = nds.concat(newNode);
        onChange?.(newNodes, edges);
        return newNodes;
      });
    },
    [readOnly, onChange, edges, screenToFlowPosition]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePublish = () => {
    setIsPublished(true);
    setTimeout(() => setIsPublished(false), 3000);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {!hideHeader && (
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">Construtor de Funis</h1>
            <p className="text-text-secondary mt-1">Planeje e visualize a jornada do seu cliente.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg border border-primary text-white hover:bg-primary/10 transition-colors text-sm font-medium">
              Salvar Rascunho
            </button>
            <button 
              onClick={handlePublish}
              className={cn(
                "px-4 py-2 rounded-lg text-white transition-colors text-sm font-medium flex items-center gap-2",
                isPublished ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/80"
              )}
            >
              {isPublished ? (
                <>
                  <CheckCircle size={16} />
                  Publicado!
                </>
              ) : (
                "Publicar Funil"
              )}
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 flex gap-4 overflow-hidden relative min-h-[500px]">
        {/* Blocks Palette */}
        {!readOnly && (
          <div className="w-64 glass-panel flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-bold text-white">Blocos</h3>
              <p className="text-xs text-text-secondary mt-1">Arraste para o canvas</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, block)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
                >
                  <block.icon size={18} className="text-text-secondary" />
                  <span className="text-sm font-medium text-white">{block.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 glass-card overflow-hidden relative rounded-xl" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
            proOptions={{ hideAttribution: true }}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
          >
            <Background color="#1E1B2E" gap={16} size={2} />
            <Controls className="bg-card border-border fill-white text-white" showInteractive={!readOnly} />
            <MiniMap 
              nodeColor={() => '#7C3AED'}
              maskColor="rgba(13, 11, 20, 0.8)"
              className="bg-card border border-border rounded-lg"
            />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {!readOnly && (
          <div className={cn(
            "absolute top-0 right-0 bottom-0 w-80 glass-panel border-l border-border transition-transform duration-300 z-10 flex flex-col",
            selectedNode ? "translate-x-0" : "translate-x-full"
          )}>
            {selectedNode && (
              <>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-heading font-bold text-white flex items-center gap-2">
                    <Settings size={18} className="text-primary" />
                    Propriedades
                  </h3>
                  <button onClick={() => setSelectedNode(null)} className="text-text-secondary hover:text-white">
                    &times;
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Nome da Etapa</label>
                    <input 
                      type="text" 
                      value={selectedNode.data.label}
                      onChange={(e) => {
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n));
                        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } });
                      }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Descrição</label>
                    <textarea 
                      value={selectedNode.data.description}
                      onChange={(e) => {
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, description: e.target.value } } : n));
                        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, description: e.target.value } });
                      }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">URL de Destino</label>
                    <input 
                      type="url" 
                      placeholder="https://"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Responsável</label>
                    <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors">
                      <option>Selecione um membro...</option>
                      <option>Admin User</option>
                      <option>Marketing Team</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <button onClick={() => setSelectedNode(null)} className="w-full py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium">
                    Concluído
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Funnels(props: FunnelsProps) {
  return (
    <ReactFlowProvider>
      <FunnelsContent {...props} />
    </ReactFlowProvider>
  );
}
