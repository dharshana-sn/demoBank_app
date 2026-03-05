/**
 * AccountCards.jsx
 * 
 * Provides a visual representation of the user's accounts as draggable cards.
 * Uses @dnd-kit to allow users to reorder their accounts via drag-and-drop.
 * Each card displays real-time balance trends and basic account information.
 */

import { useMemo, useState } from "react";
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    horizontalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { mockAccounts } from "../data/mockData.js";
import { TrendingUp, TrendingDown, GripVertical, Wallet } from "lucide-react";
import "./AccountCards.css";

function AccountCard({ account }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: account.id,
    });

    const activeCardStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    const isBalanceNegative = account.balance < 0;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...activeCardStyle,
                background: `linear-gradient(135deg, ${account.color}, ${account.color}cc)`
            }}
            className={`account-card ${isDragging ? 'is-dragging' : ''}`}
            data-testid={`account-card-${account.id}`}
            data-account-type={account.type}
            {...attributes}
            {...listeners}
        >
            <div className="card-drag-handle" data-testid={`drag-handle-${account.id}`}>
                <GripVertical size={18} color="rgba(255,255,255,0.6)" />
            </div>
            <div className="ac-header">
                <div>
                    <p className="ac-name">{account.name}</p>
                    <p className="ac-number">{account.number}</p>
                </div>
                <Wallet size={28} color="rgba(255,255,255,0.5)" />
            </div>
            <div className="ac-balance">
                <span className="ac-bal-label">Balance</span>
                <span className="ac-bal-value">
                    {isBalanceNegative ? "-" : ""}${Math.abs(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className="ac-trend">
                {isBalanceNegative
                    ? <><TrendingDown size={14} /><span>Outstanding</span></>
                    : <><TrendingUp size={14} /><span>+2.4% this month</span></>
                }
            </div>
        </div>
    );
}

export default function AccountCards({ accounts }) {
    // We use the accounts from props to ensure balances are dynamic
    // But we still want local state for reordering within the session
    const [sortedAccountIds, setSortedAccountIds] = useState(null);

    const accountList = useMemo(() => {
        if (!sortedAccountIds) return accounts;
        return [...accounts].sort((a, b) => {
            return sortedAccountIds.indexOf(a.id) - sortedAccountIds.indexOf(b.id);
        });
    }, [accounts, sortedAccountIds]);

    // Configure accessibility and pointer sensors for drag-and-drop
    const controlSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const onReorderComplete = ({ active, over }) => {
        if (active.id !== over?.id) {
            const oldIndex = accountList.findIndex(acc => acc.id === active.id);
            const newIndex = accountList.findIndex(acc => acc.id === over.id);
            const newOrder = arrayMove(accountList, oldIndex, newIndex).map(acc => acc.id);
            setSortedAccountIds(newOrder);
        }
    };

    return (
        <div className="card" data-testid="account-cards-section">
            <div className="card-header">
                <h2 className="card-title">My Accounts</h2>
                <span className="badge badge-blue">Drag to reorder</span>
            </div>
            <DndContext sensors={controlSensors} collisionDetection={closestCenter} onDragEnd={onReorderComplete}>
                <SortableContext
                    items={accountList.map(account => account.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    <div className="accounts-grid" data-testid="accounts-drag-container">
                        {accountList.map(accountItem => (
                            <AccountCard key={accountItem.id} account={accountItem} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

