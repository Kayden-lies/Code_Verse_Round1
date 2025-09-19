"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { doc, setDoc, onSnapshot, getDoc, Timestamp } from "firebase/firestore";
import { db, appId } from "@/lib/firebase";
import type { Criterion, EvaluationData, SubmissionData } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const criteria: Criterion[] = [
    { id: 1, name: 'Problem Statement Clarity', description: 'How well the problem and its significance are defined in the PPT/video.', weightage: 0.15 },
    { id: 2, name: 'Innovation & Originality', description: 'Novelty of the idea and differentiation from existing solutions.', weightage: 0.20 },
    { id: 3, name: 'Relevance to Theme / Track', description: 'Alignment of the idea with the hackathon theme/problem statement.', weightage: 0.10 },
    { id: 4, name: 'Solution Approach & Feasibility', description: 'Practicality, technical soundness, and completeness of the proposed solution.', weightage: 0.20 },
    { id: 5, name: 'Impact & Scalability', description: 'Potential reach, benefits, and long-term sustainability.', weightage: 0.15 },
    { id: 6, name: 'Presentation Quality (PPT)', description: 'Visual clarity, structure, adherence to template/logos.', weightage: 0.10 },
    { id: 7, name: 'Video Quality & Communication', description: 'Clarity of narration, visuals, time management, and engagement.', weightage: 0.10 },
];

const DEFAULT_JUDGE_ID = "default_judge";

export default function EvaluationSheet() {
    const [submissionId, setSubmissionId] = useState("");
    const [teamLeaderName, setTeamLeaderName] = useState("");
    const [scores, setScores] = useState<{ [key: string]: number }>({});
    const [comments, setComments] = useState("");
    const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { toast } = useToast();

    const clearForm = useCallback(() => {
        setScores({});
        setComments("");
        setTeamLeaderName("");
    }, []);

    useEffect(() => {
        if (!submissionId) {
            setIsLoading(false);
            setStatus({ message: "Enter a valid Team Name to load data.", type: "info" });
            return;
        }

        setIsLoading(true);
        setStatus({ message: "Loading evaluation data...", type: "info" });
        
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'evaluations', submissionId);
        
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as SubmissionData;
                const myEvaluation = data.evaluations?.[DEFAULT_JUDGE_ID];
                
                if (myEvaluation) {
                    setScores(myEvaluation.scores || {});
                    setComments(myEvaluation.comments || "");
                    setTeamLeaderName(myEvaluation.teamLeaderName || "");
                    setStatus({ message: 'Evaluation loaded successfully!', type: 'success' });
                } else {
                    clearForm();
                    setStatus({ message: 'No previous evaluation found for this submission. You can begin a new one.', type: 'info' });
                }
            } else {
                clearForm();
                setStatus({ message: 'Submission not found. You can begin a new evaluation.', type: 'info' });
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error loading document: ", error);
            toast({
                variant: "destructive",
                title: "Error Loading Data",
                description: "Could not load evaluation data. Check console for details.",
            });
            setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
    }, [submissionId, toast, clearForm]);

    const handleScoreChange = (id: number, value: string) => {
        const newScore = Math.max(0, Math.min(10, Number(value)));
        setScores(prev => ({ ...prev, [id]: newScore }));
    };

    const weightedScores = useMemo(() => {
        return criteria.reduce((acc, criterion) => {
            const score = scores[criterion.id] || 0;
            acc[criterion.id] = score * criterion.weightage * 10;
            return acc;
        }, {} as { [key: string]: number });
    }, [scores]);

    const totalScore = useMemo(() => {
        return Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
    }, [weightedScores]);

    const handleSaveEvaluation = async () => {
        if (!submissionId) {
            setStatus({ message: 'Please enter a Team Name to save.', type: 'error' });
            return;
        }

        setIsSaving(true);
        setStatus({ message: 'Saving evaluation...', type: 'info' });

        const evaluationData: EvaluationData = {
            scores,
            comments,
            totalScore,
            timestamp: new Date(),
            teamLeaderName: teamLeaderName
        };

        try {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'evaluations', submissionId);
            const docSnap = await getDoc(docRef);
            const existingData = docSnap.exists() ? docSnap.data() as SubmissionData : { evaluations: {} };
            
            if (!existingData.evaluations) {
                existingData.evaluations = {};
            }
            existingData.evaluations[DEFAULT_JUDGE_ID] = evaluationData;
            
            await setDoc(docRef, existingData);

            setStatus({ message: 'Evaluation saved successfully!', type: 'success' });
        } catch (e) {
            console.error("Error saving document: ", e);
            setStatus({ message: 'Error saving evaluation. Check console for details.', type: 'error' });
            toast({
                variant: "destructive",
                title: "Save Error",
                description: "An error occurred while saving. Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusColor = (type: string | undefined) => {
        switch (type) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-destructive';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <Card className="max-w-5xl mx-auto shadow-2xl rounded-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-4xl font-bold">Hackathon Submission Evaluation</CardTitle>
                <CardDescription className="text-lg">Use this sheet to evaluate team submissions and save the data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-12 p-6 md:p-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">1. Team Name</h2>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Input
                            id="submission-id"
                            placeholder="Enter Team Name (e.g., Team-Awesome)"
                            className="flex-grow text-base p-6"
                            value={submissionId}
                            onChange={(e) => setSubmissionId(e.target.value)}
                        />
                         <Button onClick={handleSaveEvaluation} disabled={isSaving || !submissionId} className="w-full md:w-auto px-8 py-6 text-base">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Save Evaluation'}
                        </Button>
                    </div>
                    {status && <p className={`text-sm pt-2 ${getStatusColor(status.type)}`}>{status.message}</p>}
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">2. Team Leader Name</h2>
                    <div className="mb-4">
                        <Input
                            id="team-leader-name"
                            placeholder="Enter Team Leader Name"
                            className="text-base p-6"
                            value={teamLeaderName}
                            onChange={(e) => setTeamLeaderName(e.target.value)}
                        />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">3. Evaluation Criteria</h2>
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">No.</TableHead>
                                    <TableHead>Criterion</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Weightage</TableHead>
                                    <TableHead className="text-center">Score (1-10)</TableHead>
                                    <TableHead className="text-right">Weighted Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                                ) : (
                                    criteria.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-muted-foreground">{item.id}</TableCell>
                                            <TableCell className="font-semibold">{item.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{item.description}</TableCell>
                                            <TableCell className="text-center">{(item.weightage * 100).toFixed(0)}%</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="w-24 mx-auto text-center"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                    value={scores[item.id] || ''}
                                                    onChange={(e) => handleScoreChange(item.id, e.target.value)}
                                                    aria-label={`Score for ${item.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{weightedScores[item.id]?.toFixed(2) || '0.00'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight">4. Scoring Method</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Each criterion is scored on a 1-10 scale by each judge.</li>
                            <li>Score &times; weightage &times; 10 = weighted score.</li>
                            <li>Total possible score = 100 points.</li>
                            <li>Judges may also leave qualitative comments for feedback.</li>
                        </ul>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-6 space-y-2">
                         <div className="text-lg font-bold text-muted-foreground">Total Score</div>
                         <div className="text-6xl font-extrabold text-primary">{totalScore.toFixed(2)}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">5. Review and Notes</h2>
                    <Textarea
                        id="comments"
                        className="min-h-[150px] text-base"
                        placeholder="Enter your qualitative feedback and comments here..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">Data is synced in real-time. Changes are saved when you click the "Save Evaluation" button.</p>
                </div>
            </CardContent>
        </Card>
    );
}
