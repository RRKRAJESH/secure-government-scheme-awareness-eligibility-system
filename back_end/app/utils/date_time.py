from datetime import datetime, timezone, timedelta

def current_time_utc():
    try:
        return datetime.now(timezone.utc)
    except Exception as e:
        msg =f"Error occured while processing current_time_utc():: {str(e)}"
        raise Exception(msg)
    
def time_taken_in_millis(start_time, end_time):
    try:
        time_taken = float(((end_time.replace(tzinfo=timezone.utc)) -
        (start_time.replace(tzinfo=timezone.utc))).total_seconds() * 1000)

        return time_taken

    except Exception as e:
        msg =f"Error occured while processing time_taken_in_millis():: {str(e)}"
        raise Exception(msg)