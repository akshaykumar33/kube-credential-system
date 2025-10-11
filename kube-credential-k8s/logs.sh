#!/bin/bash

# Kube Credential System - Interactive Logs Viewer

echo "📋 Kube Credential System - Logs Viewer"
echo "======================================="

# Function to show menu
show_menu() {
    echo ""
    echo "Select component to view logs:"
    echo "1) 🗄️  Redis"
    echo "2) 🏢 Issuance Service" 
    echo "3) 🔍 Verification Service"
    echo "4) 🌐 Issuance Frontend"
    echo "5) 🌐 Verification Frontend"
    echo "6) 📊 All Components (parallel view)"
    echo "7) 🔄 Follow All Logs (real-time)"
    echo "8) 📋 Show Recent Events"
    echo "0) ❌ Exit"
    echo ""
}

# Function to view logs
view_logs() {
    local component=$1
    local follow=${2:-false}

    case $component in
        1)
            echo "📋 Redis Logs:"
            echo "-------------"
            if [ "$follow" = true ]; then
                kubectl logs -f deployment/redis -n kube-credential
            else
                kubectl logs deployment/redis -n kube-credential --tail=50
            fi
            ;;
        2)
            echo "📋 Issuance Service Logs:"
            echo "------------------------"
            if [ "$follow" = true ]; then
                kubectl logs -f deployment/issuance-service -n kube-credential
            else
                kubectl logs deployment/issuance-service -n kube-credential --tail=50
            fi
            ;;
        3)
            echo "📋 Verification Service Logs:"
            echo "----------------------------"
            if [ "$follow" = true ]; then
                kubectl logs -f deployment/verification-service -n kube-credential
            else
                kubectl logs deployment/verification-service -n kube-credential --tail=50
            fi
            ;;
        4)
            echo "📋 Issuance Frontend Logs:"
            echo "-------------------------"
            if [ "$follow" = true ]; then
                kubectl logs -f deployment/issuance-frontend -n kube-credential
            else
                kubectl logs deployment/issuance-frontend -n kube-credential --tail=50
            fi
            ;;
        5)
            echo "📋 Verification Frontend Logs:"
            echo "-----------------------------"
            if [ "$follow" = true ]; then
                kubectl logs -f deployment/verification-frontend -n kube-credential
            else
                kubectl logs deployment/verification-frontend -n kube-credential --tail=50
            fi
            ;;
        6)
            echo "📋 All Component Logs (Last 20 lines each):"
            echo "============================================"
            echo ""
            echo "🗄️  REDIS:"
            kubectl logs deployment/redis -n kube-credential --tail=20 2>/dev/null || echo "   No Redis logs available"
            echo ""
            echo "🏢 ISSUANCE SERVICE:"
            kubectl logs deployment/issuance-service -n kube-credential --tail=20 2>/dev/null || echo "   No Issuance logs available"
            echo ""
            echo "🔍 VERIFICATION SERVICE:"
            kubectl logs deployment/verification-service -n kube-credential --tail=20 2>/dev/null || echo "   No Verification logs available"
            echo ""
            echo "🌐 ISSUANCE FRONTEND:"
            kubectl logs deployment/issuance-frontend -n kube-credential --tail=20 2>/dev/null || echo "   No Frontend logs available"
            echo ""
            echo "🌐 VERIFICATION FRONTEND:"
            kubectl logs deployment/verification-frontend -n kube-credential --tail=20 2>/dev/null || echo "   No Frontend logs available"
            ;;
        7)
            echo "🔄 Following all logs (Ctrl+C to stop)..."
            echo "========================================="
            # Run all log streams in parallel
            kubectl logs -f deployment/redis -n kube-credential --prefix=true 2>/dev/null &
            kubectl logs -f deployment/issuance-service -n kube-credential --prefix=true 2>/dev/null &
            kubectl logs -f deployment/verification-service -n kube-credential --prefix=true 2>/dev/null &
            kubectl logs -f deployment/issuance-frontend -n kube-credential --prefix=true 2>/dev/null &
            kubectl logs -f deployment/verification-frontend -n kube-credential --prefix=true 2>/dev/null &
            wait
            ;;
        8)
            echo "📋 Recent Kubernetes Events:"
            echo "=============================="
            kubectl get events -n kube-credential --sort-by='.lastTimestamp' 2>/dev/null || echo "   No events found"
            ;;
        0)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option"
            ;;
    esac
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice [0-8]: " choice

    case $choice in
        [1-5])
            echo ""
            read -p "Follow logs in real-time? [y/N]: " follow_choice
            case $follow_choice in
                [Yy]*)
                    view_logs $choice true
                    ;;
                *)
                    view_logs $choice false
                    ;;
            esac
            ;;
        6|7|8)
            view_logs $choice
            ;;
        0)
            view_logs $choice
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac

    if [ $choice -ne 0 ] && [ $choice -ne 7 ]; then
        echo ""
        read -p "Press Enter to continue..." 
    fi
done
