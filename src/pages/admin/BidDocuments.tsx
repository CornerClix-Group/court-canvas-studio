import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload, FileText, Calendar, Shield, MapPin, DollarSign,
  ClipboardList, Send, Loader2, AlertTriangle, CheckCircle,
  Clock, Building, HardHat, FileSearch, MessageSquare,
  Trash2, ChevronDown, ChevronUp, FolderKanban, Plus,
} from "lucide-react";
import { format } from "date-fns";

interface BidDocument {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  extracted_data: any;
  created_at: string;
  project_id: string | null;
  projects?: { project_name: string } | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Project {
  id: string;
  project_name: string;
  status: string;
}

export default function BidDocuments() {
  const [documents, setDocuments] = useState<BidDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<BidDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("bid_documents")
      .select("id, title, file_name, file_type, file_size, status, extracted_data, created_at, project_id")
      .order("created_at", { ascending: false });

    if (!error && data) setDocuments(data);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, project_name, status")
      .order("created_at", { ascending: false });
    if (data) setProjects(data);
  };

  const MAX_FILE_SIZE_MB = 50;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast({
        variant: "destructive",
        title: "File too large for this project",
        description: `Supabase currently allows up to ${MAX_FILE_SIZE_MB}MB per file. Your file is ${fileSizeMB.toFixed(1)}MB. Please split/compress it and re-upload.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPendingFile(file);
    setSelectedProjectId("");
    setNewProjectName("");
    setCreatingProject(false);
    setUploadDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateProjectAndUpload = async () => {
    if (!newProjectName.trim()) {
      toast({ variant: "destructive", title: "Enter a project name" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: project, error } = await supabase
      .from("projects")
      .insert({ project_name: newProjectName.trim(), status: "sold" })
      .select("id, project_name, status")
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Failed to create project", description: error.message });
      return;
    }

    setProjects((prev) => [project, ...prev]);
    setSelectedProjectId(project.id);
    setCreatingProject(false);

    // Now upload with this project
    await doUpload(project.id);
  };

  const handleUploadWithProject = async () => {
    const projectId = selectedProjectId && selectedProjectId !== "none" ? selectedProjectId : null;
    await doUpload(projectId);
  };

  const doUpload = async (projectId: string | null) => {
    if (!pendingFile) return;
    setUploadDialogOpen(false);
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const file = pendingFile;
      const fileExt = file.name.split(".").pop();
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("bid-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const insertData: any = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        status: "uploaded",
        uploaded_by: session.user.id,
      };
      if (projectId) insertData.project_id = projectId;

      const { data: doc, error: insertError } = await supabase
        .from("bid_documents")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      toast({ title: "Document uploaded", description: "Starting AI analysis..." });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-bid-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ documentId: doc.id }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      toast({ title: "Analysis complete", description: "Key details have been extracted." });
      await fetchDocuments();

      const { data: updatedDoc } = await supabase
        .from("bid_documents")
        .select("id, title, file_name, file_type, file_size, status, extracted_data, created_at, project_id")
        .eq("id", doc.id)
        .single();

      if (updatedDoc) {
        setSelectedDoc(updatedDoc);
        setChatMessages([]);
      }
    } catch (error: any) {
      const message = error?.message || "Unknown error";
      const isSizeError = /maximum allowed size|payload too large|413/i.test(message);

      toast({
        variant: "destructive",
        title: isSizeError ? "File too large for this project" : "Upload failed",
        description: isSizeError
          ? "Your Supabase project currently has a 50MB upload cap. Please split or compress this file and try again."
          : message,
      });
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedDoc || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bid-document-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ documentId: selectedDoc.id, messages: updatedMessages }),
        }
      );

      if (!response.ok || !response.body) throw new Error("Chat failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setChatMessages([
                ...updatedMessages,
                { role: "assistant", content: assistantContent },
              ]);
            }
          } catch {
            // partial JSON
          }
        }
      }

      await supabase.from("bid_document_messages").insert([
        { bid_document_id: selectedDoc.id, role: "user", content: userMsg.content },
        { bid_document_id: selectedDoc.id, role: "assistant", content: assistantContent },
      ]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Chat error", description: error.message });
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const { error } = await supabase.from("bid_documents").delete().eq("id", docId);
    if (!error) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setChatMessages([]);
      }
      toast({ title: "Document deleted" });
    }
  };

  const selectDocument = async (doc: BidDocument) => {
    setSelectedDoc(doc);
    const { data } = await supabase
      .from("bid_document_messages")
      .select("role, content")
      .eq("bid_document_id", doc.id)
      .order("created_at", { ascending: true });

    setChatMessages((data as ChatMessage[]) || []);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getProjectName = (doc: BidDocument) => {
    if (!doc.project_id) return null;
    const project = projects.find((p) => p.id === doc.project_id);
    return project?.project_name || null;
  };

  const renderExtractedField = (icon: React.ReactNode, label: string, value: any, key: string) => {
    if (!value || value === "null") return null;
    const isExpanded = expandedSection === key;
    const isLong = typeof value === "string" && value.length > 100;

    return (
      <div className="border border-border rounded-lg p-3">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : key)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          {isLong && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
        </button>
        <div className={`mt-2 text-sm text-muted-foreground ${isLong && !isExpanded ? "line-clamp-2" : ""}`}>
          {typeof value === "object" ? (
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(value, null, 2)}</pre>
          ) : (
            String(value)
          )}
        </div>
      </div>
    );
  };

  const data = selectedDoc?.extracted_data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bid Documents</h1>
          <p className="text-muted-foreground">Upload bid documents for AI-powered analysis and Q&A</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "Uploading & Analyzing..." : "Upload Document"}
          </Button>
        </div>
      </div>

      {/* Upload dialog — assign to project */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Optionally assign <strong>{pendingFile?.name}</strong> to a project for easy organization.
            </p>

            {!creatingProject ? (
              <>
                <div className="space-y-2">
                  <Label>Select Existing Project</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="No project (unassigned)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project (unassigned)</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCreatingProject(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Label>New Project Name</Label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., May Park Improvements"
                />
                <Button variant="ghost" size="sm" onClick={() => setCreatingProject(false)}>
                  ← Back to existing projects
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            {creatingProject ? (
              <Button onClick={handleCreateProjectAndUpload} disabled={!newProjectName.trim()}>
                Create Project & Upload
              </Button>
            ) : (
              <Button onClick={handleUploadWithProject}>
                Upload{selectedProjectId && selectedProjectId !== "none" ? " & Assign" : ""}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <FileSearch className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 p-2">
                  {documents.map((doc) => {
                    const projectName = getProjectName(doc);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => selectDocument(doc)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedDoc?.id === doc.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            {projectName && (
                              <p className={`text-xs flex items-center gap-1 ${selectedDoc?.id === doc.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                <FolderKanban className="w-3 h-3" />
                                {projectName}
                              </p>
                            )}
                            <p className={`text-xs ${selectedDoc?.id === doc.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {formatFileSize(doc.file_size)} · {format(new Date(doc.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={doc.status === "analyzed" ? "default" : doc.status === "error" ? "destructive" : "secondary"}
                              className="text-[10px] px-1.5"
                            >
                              {doc.status === "analyzed" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : doc.status === "error" ? (
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {doc.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Analysis + Chat */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDoc ? (
            <>
              {/* Extracted Details */}
              {data && selectedDoc.status === "analyzed" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Extracted Details — {selectedDoc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {renderExtractedField(<Calendar className="w-4 h-4 text-red-500" />, "Bid Deadline", data.bid_deadline, "deadline")}
                      {renderExtractedField(<Building className="w-4 h-4 text-blue-500" />, "Project Name", data.project_name, "name")}
                      {renderExtractedField(<MapPin className="w-4 h-4 text-green-500" />, "Location", data.project_location, "location")}
                      {renderExtractedField(<Building className="w-4 h-4 text-purple-500" />, "Owner / Agency", data.owner_agency, "owner")}
                      {renderExtractedField(<FileText className="w-4 h-4 text-orange-500" />, "Scope of Work", data.scope_of_work, "scope")}
                      {renderExtractedField(<HardHat className="w-4 h-4 text-yellow-600" />, "Court Details", data.court_details, "courts")}
                      {renderExtractedField(<Shield className="w-4 h-4 text-indigo-500" />, "Bond Requirements", data.bond_requirements, "bonds")}
                      {renderExtractedField(<Shield className="w-4 h-4 text-teal-500" />, "Insurance", data.insurance_requirements, "insurance")}
                      {renderExtractedField(<HardHat className="w-4 h-4 text-amber-500" />, "Material Specs", data.material_specs, "materials")}
                      {renderExtractedField(<DollarSign className="w-4 h-4 text-emerald-500" />, "Budget Range", data.budget_range, "budget")}
                      {renderExtractedField(<Clock className="w-4 h-4 text-cyan-500" />, "Timeline", data.timeline, "timeline")}
                      {renderExtractedField(<ClipboardList className="w-4 h-4 text-rose-500" />, "Submission Requirements", data.submission_requirements, "submission")}
                      {renderExtractedField(<Calendar className="w-4 h-4 text-violet-500" />, "Pre-Bid Meeting", data.pre_bid_meeting, "prebid")}
                      {renderExtractedField(<AlertTriangle className="w-4 h-4 text-orange-600" />, "Prevailing Wage", data.prevailing_wage ? "Yes" : data.prevailing_wage === false ? "No" : null, "wage")}
                      {renderExtractedField(<FileText className="w-4 h-4 text-slate-500" />, "Certifications Required", data.certifications_required, "certs")}
                      {renderExtractedField(<DollarSign className="w-4 h-4 text-red-600" />, "Liquidated Damages", data.liquidated_damages, "damages")}
                    </div>
                    {data.important_notes?.length > 0 && (
                      <div className="mt-4 border border-border rounded-lg p-3">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Important Notes
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {data.important_notes.map((note: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedDoc.status === "analyzing" && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                    <p className="font-medium">Analyzing document...</p>
                    <p className="text-sm text-muted-foreground">This may take a minute for large documents.</p>
                  </CardContent>
                </Card>
              )}

              {selectedDoc.status === "error" && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-destructive" />
                    <p className="font-medium">Analysis failed</p>
                    <p className="text-sm text-muted-foreground">Try re-uploading the document or a smaller version.</p>
                  </CardContent>
                </Card>
              )}

              {/* Chat Interface */}
              {selectedDoc.status === "analyzed" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Ask Questions About This Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] mb-4 border border-border rounded-lg p-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Ask anything about the bid document</p>
                          <p className="text-xs mt-1">e.g., "What are the bond requirements?" or "When is the pre-bid meeting?"</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a question about this bid document..."
                        className="min-h-[44px] max-h-[120px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleChat();
                          }
                        }}
                      />
                      <Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} size="icon">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <FileSearch className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">Select a document or upload a new one</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload bid documents (PDFs, images) to automatically extract key details and ask questions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
