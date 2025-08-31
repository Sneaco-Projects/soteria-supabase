"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
  Plus, User, Phone, StickyNote, AlertTriangle, CheckCircle,
  MoreHorizontal, Pencil, Trash2, Heart, Menu, LogOut, Users
} from "lucide-react";

type Sentinel = { id: string; full_name: string; phone: string | null; notes: string | null };

export default function WardenDashboard() {
  // sidebar
  const [collapsed, setCollapsed] = useState(false);

  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete confirm
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modals (global)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sentinels")
        .select("id, full_name, phone, notes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSentinels(data ?? []);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load sentinels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const addSentinel = async () => {
    if (!fullName.trim()) {
      setErrorMsg("Please enter the Sentinel’s full name.");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { error } = await supabase.from("sentinels").insert({
        owner_guardian_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;

      setOpenAdd(false);
      setFullName(""); setPhone(""); setNotes("");
      setSuccessMsg("Sentinel added.");
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to add sentinel.");
    }
  };

  const openEditFor = (s: Sentinel) => {
    setEditId(s.id);
    setEditName(s.full_name);
    setEditPhone(s.phone ?? "");
    setEditNotes(s.notes ?? "");
    setOpenEdit(true);
  };

  const updateSentinel = async () => {
    if (!editId) return;
    if (!editName.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    try {
      const { error } = await supabase
        .from("sentinels")
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
          notes: editNotes.trim() || null,
        })
        .eq("id", editId);
      if (error) throw error;

      setOpenEdit(false);
      setEditId(null);
      setSuccessMsg("Sentinel updated.");
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update sentinel.");
    }
  };

  const askDelete = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const deleteSentinel = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("sentinels")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;

      setOpenDelete(false);
      setDeleteId(null);
      setSuccessMsg("Sentinel deleted.");
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to delete sentinel.");
    }
  };

  return (
    <>
      {/* Error / Success Modals */}
      <AlertDialog open={!!errorMsg} onOpenChange={(o) => !o && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Something went wrong</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!successMsg} onOpenChange={(o) => !o && setSuccessMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-600" /> Success</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{successMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setSuccessMsg(null)}>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Layout with collapsing sidebar */}
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside
          className={`bg-white/90 backdrop-blur-lg border-r border-emerald-200 h-screen sticky top-0 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
        >
          <div className="flex items-center justify-between px-3 py-3 border-b border-emerald-200">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              {!collapsed && <span className="font-semibold text-gray-800">Warden</span>}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <nav className="px-2 py-3 space-y-1">
            <div
              className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-emerald-50 text-emerald-700"
              aria-current="page"
            >
              <Users className="h-4 w-4" />
              {!collapsed && <span>Sentinels</span>}
            </div>

            <div className="pt-3 border-t border-emerald-100" />
            <button
              className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-red-50 text-red-600"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 relative">
          {/* Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse delay-2000"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6">
            {/* Empty state */}
            {(!loading && sentinels.length === 0) && (
              <Card className="border-emerald-200 bg-white/90">
                <CardHeader><CardTitle>No Sentinels yet</CardTitle></CardHeader>
                <CardContent className="text-gray-600">Add your first Sentinel to start managing their safety profile.</CardContent>
              </Card>
            )}

            {/* List + Add button */}
            <div className="flex justify-end mb-4">
              <Button onClick={() => setOpenAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" /> Add Sentinel
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sentinels.map((s) => (
                <Card key={s.id} className="border-emerald-200 bg-white/90">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-600" /> {s.full_name}
                    </CardTitle>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditFor(s)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => askDelete(s.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {s.phone || "—"}</div>
                    <div className="flex items-start gap-2"><StickyNote className="h-4 w-4 mt-0.5" /> <span>{s.notes || "No notes"}</span></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Sentinel Modal */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Sentinel</AlertDialogTitle>
            <AlertDialogDescription>Create a device user profile you can assign to a device later.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, conditions…" />
            </div>
          </div>
          <AlertDialogFooter><AlertDialogAction onClick={addSentinel}>Save</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Sentinel Modal */}
      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Sentinel</AlertDialogTitle>
            <AlertDialogDescription>Update the sentinel’s info.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter><AlertDialogAction onClick={updateSentinel}>Save Changes</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Modal */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sentinel?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the sentinel record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpenDelete(false)}>Cancel</AlertDialogAction>
            <Button onClick={deleteSentinel} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
