from flask import Blueprint, Response, jsonify
from backend.services.video_stream import gen_frames, get_last_qr_data, get_last_food_pred, get_pending_order, confirm_pending_order, reject_pending_order

bp = Blueprint('video', __name__)

@bp.route('/video_feed')
def video_feed():
    """
    Video streaming endpoint for real-time camera feed.
    """
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@bp.route('/last_qr')
def last_qr():
    """
    Get the last scanned QR code data.
    """
    data = get_last_qr_data()
    return jsonify({'last_qr': data})

@bp.route('/last_food')
def last_food():
    """
    Get the last predicted food from the camera.
    """
    data = get_last_food_pred()
    return jsonify({'last_food': data})

@bp.route('/pending_order')
def pending_order():
    """
    Get the current pending order detected by the camera.
    """
    return get_pending_order()

@bp.route('/confirm_order', methods=['POST'])
def confirm_order():
    """
    Confirm and save the pending order.
    """
    return confirm_pending_order()

@bp.route('/reject_order', methods=['POST'])
def reject_order():
    """
    Reject and clear the pending order.
    """
    return reject_pending_order() 